import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import {
  getNatalChartCredits,
  listNatalChartReadingsForUser,
  saveNatalChartWithEntitlement,
} from "@/lib/repositories/natal-chart.repository";
import { getPremiumState } from "@/lib/repositories/subscription.repository";
import { createNatalChartSchema } from "@/lib/validation/natal-chart.schema";
import { calculateNatalChart } from "@/modules/astrology/services/calculate-natal-chart";
import { resolveBirthInstantUtc } from "@/modules/astrology/services/resolve-birth-instant";
import { enforceRateLimit } from "@/lib/rate-limit";

// Натальная карта платная (бесплатного уровня нет): цены в lib/pricing/natal-chart-pricing.ts.
// Построить карту может только вошедший пользователь: с положительным остатком кредитов либо с
// действующей подпиской Premium, у которой свободно недельное построение.

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "db_not_configured", message: "Persistence isn't configured yet." }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [credits, readings, premium] = await Promise.all([
    getNatalChartCredits(session.user.id),
    listNatalChartReadingsForUser(session.user.id),
    getPremiumState(session.user.id),
  ]);
  return NextResponse.json({
    credits,
    readings,
    premium: {
      active: premium.planTier === "premium",
      fullAccess: premium.fullAccess,
      currentPeriodEnd: premium.currentPeriodEnd,
      freeChartAvailable: premium.natalChartWeekly.available,
      nextFreeChartAt: premium.natalChartWeekly.nextAvailableAt,
    },
  });
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "natal-chart", { limit: 10, windowSeconds: 60 });
  if (limited) return limited;
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

  const saved = await saveNatalChartWithEntitlement({
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
    return NextResponse.json({ error: "insufficient_credits", message: "No Natal Chart credits left and no free weekly chart available." }, { status: 402 });
  }

  return NextResponse.json({ reading: saved, chart }, { status: 201 });
}
