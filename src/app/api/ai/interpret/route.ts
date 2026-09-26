import { NextResponse } from "next/server";
import { track } from "@/lib/analytics";
import { aiInterpretRequestSchema } from "@/lib/validation/reading.schema";
import { generateInterpretation } from "@/modules/ai/ai-interpretation.service";
import { requireCardById } from "@/modules/tarot/domain/deck";
import { requireSpreadById } from "@/modules/tarot/domain/spreads.data";
import type { DrawnCard } from "@/modules/tarot/domain/types";

// Deliberately open to guests (no auth check) — AI interpretation is part of
// the try-before-signup reading flow (see PROJECT_ARCHITECTURE.md Decision Log #4).
// Request-level rate limiting is tracked as future work in TODO.md.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = aiInterpretRequestSchema.safeParse(body);
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

  const positionById = new Map(spread.positions.map((position) => [position.id, position]));

  let drawnCards: DrawnCard[];
  try {
    drawnCards = [...parsed.data.cards]
      .sort((a, b) => a.order - b.order)
      .map((entry) => {
        const position = positionById.get(entry.positionId);
        if (!position) throw new Error(`Unknown position "${entry.positionId}"`);
        return { card: requireCardById(entry.cardId), orientation: entry.orientation, position };
      });
  } catch {
    return NextResponse.json({ error: "invalid_input", message: "Card or position ids do not match the spread." }, { status: 400 });
  }

  try {
    const interpretation = await generateInterpretation({
      question: parsed.data.question ?? null,
      spread,
      cards: drawnCards,
      locale: parsed.data.locale,
    });
    track({ name: "ai_interpretation_requested", spreadId: spread.id, provider: interpretation.provider });
    return NextResponse.json({ interpretation });
  } catch (error) {
    console.error("[api/ai/interpret]", error);
    return NextResponse.json({ error: "interpretation_failed", message: "Couldn't generate an interpretation right now." }, { status: 502 });
  }
}
