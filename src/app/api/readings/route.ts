import { NextResponse } from "next/server";
import { track } from "@/lib/analytics";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { countReadingsToday, createReading, listReadingsForUser, saveAIInterpretation } from "@/lib/repositories/reading.repository";
import { createReadingSchema } from "@/lib/validation/reading.schema";
import { canStartReading } from "@/modules/subscriptions/usage-limit.service";
import { requireSpreadById } from "@/modules/tarot/domain/spreads.data";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "db_not_configured", message: "Persistence isn't configured yet." }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const readings = await listReadingsForUser(session.user.id);
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
  const parsed = createReadingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.flatten() }, { status: 400 });
  }

  let spread;
  try {
    spread = requireSpreadById(parsed.data.spreadId);
  } catch {
    return NextResponse.json({ error: "invalid_input", message: "Unknown spread." }, { status: 400 });
  }

  if (parsed.data.cards.length !== spread.cardCount) {
    return NextResponse.json({ error: "invalid_input", message: "Card count does not match the spread." }, { status: 400 });
  }

  const readingsToday = await countReadingsToday(session.user.id);
  const entitlement = canStartReading({ planTier: session.user.planTier, spread, readingsToday });
  if (!entitlement.allowed) {
    return NextResponse.json({ error: "limit_reached", message: entitlement.reason }, { status: 403 });
  }

  const reading = await createReading({
    userId: session.user.id,
    spreadId: parsed.data.spreadId,
    question: parsed.data.question ?? null,
    seed: parsed.data.seed,
    cards: parsed.data.cards,
  });

  if (parsed.data.aiInterpretation) {
    await saveAIInterpretation(reading.id, parsed.data.aiInterpretation);
  }

  track({ name: "reading_saved", readingId: reading.id });

  return NextResponse.json({ reading }, { status: 201 });
}
