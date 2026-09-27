import { NextResponse } from "next/server";
import { track } from "@/lib/analytics";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { createAstrologyReading, listAstrologyReadingsForUser } from "@/lib/repositories/astrology.repository";
import { createAstrologyReadingSchema } from "@/lib/validation/numerology-astrology.schema";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "db_not_configured", message: "Persistence isn't configured yet." }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const readings = await listAstrologyReadingsForUser(session.user.id);
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
  const parsed = createAstrologyReadingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const reading = await createAstrologyReading({
    userId: session.user.id,
    birthDate: new Date(`${parsed.data.birthDate}T00:00:00`),
    sunSign: parsed.data.sunSign,
    sect: parsed.data.sect ?? null,
  });

  track({ name: "astrology_calculated", sunSign: parsed.data.sunSign });

  return NextResponse.json({ reading }, { status: 201 });
}
