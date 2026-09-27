import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import {
  getNatalChartCredits,
  listNatalChartReadingsForUser,
  spendCreditAndSaveNatalChart,
} from "@/lib/repositories/natal-chart.repository";
import { createNatalChartSchema } from "@/lib/validation/natal-chart.schema";
import { calculateNatalChart } from "@/modules/astrology/services/calculate-natal-chart";
import { resolveBirthInstantUtc } from "@/modules/astrology/services/resolve-birth-instant";

// Natal Chart is paid-only from the start (no free tier) — see
// lib/pricing/natal-chart-pricing.ts and PROJECT_ARCHITECTURE.md §17b.

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "db_not_configured", message: "Persistence isn't configured yet." }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [credits, readings] = await Promise.all([
    getNatalChartCredits(session.user.id),
    listNatalChartReadingsForUser(session.user.id),
  ]);
  return NextResponse.json({ credits, readings });
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "db_not_configured", message: "Persistence isn't configured yet." }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createNatalChartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  let birthDateUtc: Date;
  try {
    birthDateUtc = resolveBirthInstantUtc({
      year: input.year,
      month: input.month,
      day: input.day,
      hour: input.hasExactTime ? input.hour : undefined,
      minute: input.hasExactTime ? input.minute : undefined,
      timezone: input.timezone,
    });
  } catch {
    return NextResponse.json({ error: "invalid_input", message: "Could not resolve the birth date/time in that timezone." }, { status: 400 });
  }

  const chart = calculateNatalChart({
    birthDateUtc,
    hasExactTime: input.hasExactTime,
    latitude: input.latitude,
    longitude: input.longitude,
  });

  const saved = await spendCreditAndSaveNatalChart({
    userId: session.user.id,
    birthDate: birthDateUtc,
    hasExactTime: input.hasExactTime,
    birthPlace: input.placeLabel ?? null,
    latitude: input.latitude,
    longitude: input.longitude,
    timezone: input.timezone,
    chart,
  });

  if (!saved) {
    return NextResponse.json({ error: "insufficient_credits", message: "No Natal Chart credits left." }, { status: 402 });
  }

  return NextResponse.json({ reading: saved, chart }, { status: 201 });
}
