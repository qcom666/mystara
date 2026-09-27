import { NextResponse } from "next/server";
import { track } from "@/lib/analytics";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { createNumerologyReading, listNumerologyReadingsForUser } from "@/lib/repositories/numerology.repository";
import { createNumerologyReadingSchema } from "@/lib/validation/numerology-astrology.schema";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "db_not_configured", message: "Persistence isn't configured yet." }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const readings = await listNumerologyReadingsForUser(session.user.id);
  return NextResponse.json({ readings });
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
  const parsed = createNumerologyReadingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const reading = await createNumerologyReading({
    userId: session.user.id,
    birthDate: new Date(`${parsed.data.birthDate}T00:00:00`),
    lifePathNumber: parsed.data.lifePathNumber,
    birthdayNumber: parsed.data.birthdayNumber,
    fullName: parsed.data.fullName ?? null,
    pythagorean: parsed.data.pythagorean ?? null,
    chaldean: parsed.data.chaldean ?? null,
  });

  track({ name: "numerology_calculated", lifePathNumber: parsed.data.lifePathNumber });

  return NextResponse.json({ reading }, { status: 201 });
}
