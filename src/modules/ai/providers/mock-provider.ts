import { getCardKeywords, getCardMeanings, getCardName } from "@/modules/tarot/domain/deck";
import { getPositionLabel, getSpreadName } from "@/modules/tarot/domain/spreads.data";
import type { DrawnCard } from "@/modules/tarot/domain/types";
import {
  getInterpretationDisclaimer,
  type AIInterpretationProvider,
  type AIInterpretationRequest,
  type AIInterpretationResult,
  type InterpretationLocale,
} from "../types";

type Focus = "love" | "career" | "finance" | "general";

// Cyrillic has no `\b` word boundary in JS regexes, so the Russian patterns
// match word stems instead (любов- → любовь/любви/любовный…).
const FOCUS_PATTERNS: Record<Exclude<Focus, "general">, RegExp> = {
  love: /love|relationship|partner|dating|marriage|\bex\b|любо|отношени|партн[её]р|свидани|брак|замуж|женит|бывш/,
  career: /job|career|work|business|promotion|boss|coworker|работ|карьер|бизнес|повышени|начальник|коллег|должност|увольн|проф/,
  finance: /money|finance|financial|debt|invest|salary|afford|деньг|финанс|долг|инвест|зарплат|доход|кредит|накоплен|бюджет/,
};

function detectFocus(question: string | null): Focus {
  if (!question) return "general";
  const q = question.toLowerCase();
  if (FOCUS_PATTERNS.love.test(q)) return "love";
  if (FOCUS_PATTERNS.career.test(q)) return "career";
  if (FOCUS_PATTERNS.finance.test(q)) return "finance";
  return "general";
}

function describeCard(drawn: DrawnCard, focus: Focus, locale: InterpretationLocale): string {
  const { card, orientation, position } = drawn;
  const meanings = getCardMeanings(card, locale);
  const base = orientation === "upright" ? meanings.upright : meanings.reversed;
  const angle = focus === "love" ? meanings.love : focus === "career" ? meanings.career : focus === "finance" ? meanings.finance : meanings.spiritual;
  const label = getPositionLabel(position, locale);
  const name = getCardName(card, locale);
  if (locale === "ru") {
    const orientationNote = orientation === "reversed" ? " (перевёрнутая)" : "";
    return `В позиции «${label}» карта «${name}»${orientationNote} подсказывает: ${base} ${angle}`;
  }
  const orientationNote = orientation === "reversed" ? " (reversed)" : "";
  return `In the ${label} position, ${name}${orientationNote} suggests: ${base} ${angle}`;
}

function collectThemes(cards: DrawnCard[], locale: InterpretationLocale): string[] {
  const seen = new Set<string>();
  for (const drawn of cards) {
    for (const keyword of getCardKeywords(drawn.card, locale)) {
      seen.add(keyword);
      if (seen.size >= 5) return Array.from(seen);
    }
  }
  return Array.from(seen);
}

type Tone = "clear" | "friction" | "mixed";

const TONE_TEXT: Record<InterpretationLocale, Record<Tone, string>> = {
  en: {
    clear: "a clear, forward-moving energy",
    friction: "some internal friction or blocked energy worth sitting with",
    mixed: "a mix of clear momentum and a few sticking points",
  },
  ru: {
    clear: "ясную, устремлённую вперёд энергию",
    friction: "внутреннее трение или заблокированную энергию, с которой стоит побыть",
    mixed: "сочетание явного движения вперёд и нескольких сложных моментов",
  },
};

/**
 * Deterministic, fully offline. This is the default provider so the product
 * works end to end with zero configuration — see PROJECT_ARCHITECTURE.md §8.
 * Writes in English or Russian depending on `request.locale`, composing from
 * the matching card meanings so the output is genuinely in that language
 * rather than a translated template wrapped around English text.
 */
export class MockAIProvider implements AIInterpretationProvider {
  readonly id = "mock";

  async generate(request: AIInterpretationRequest): Promise<AIInterpretationResult> {
    const { question, spread, cards } = request;
    const locale = request.locale ?? "en";
    const focus = detectFocus(question);
    const ru = locale === "ru";

    const cardInterpretations = cards.map((drawn) => ({
      positionId: drawn.position.id,
      cardId: drawn.card.id,
      interpretation: describeCard(drawn, focus, locale),
    }));

    const uprightCards = cards.filter((c) => c.orientation === "upright");
    const reversedCards = cards.filter((c) => c.orientation === "reversed");

    const advice =
      uprightCards.length > 0
        ? uprightCards
            .slice(0, 3)
            .map((d) =>
              ru
                ? `Опирайтесь на карту «${getCardName(d.card, locale)}»: ${getCardMeanings(d.card, locale).spiritual}`
                : `Lean into ${getCardName(d.card, locale)}: ${getCardMeanings(d.card, locale).spiritual}`,
            )
        : [
            ru
              ? "Одна из возможных трактовок: возможно, сейчас стоит замедлиться и подумать, прежде чем действовать."
              : "One possible interpretation: this may be a moment to slow down and reflect before acting.",
          ];

    const challenges =
      reversedCards.length > 0
        ? reversedCards
            .slice(0, 3)
            .map((d) =>
              ru
                ? `Обратите внимание на теневую сторону карты «${getCardName(d.card, locale)}»: ${getCardMeanings(d.card, locale).reversed}`
                : `Watch for the shadow side of ${getCardName(d.card, locale)}: ${getCardMeanings(d.card, locale).reversed}`,
            )
        : [ru ? "В этом раскладе не видно ярко выраженной заблокированной энергии." : "No strongly blocked energy stands out in this reading."];

    const themes = collectThemes(cards, locale);
    const reversedRatio = reversedCards.length / Math.max(cards.length, 1);
    const tone: Tone = reversedRatio === 0 ? "clear" : reversedRatio >= 0.5 ? "friction" : "mixed";
    const toneText = TONE_TEXT[locale][tone];

    const spreadName = getSpreadName(spread, locale);
    const themeList = themes.slice(0, 3).join(", ");
    const disclaimer = getInterpretationDisclaimer(locale);

    const overall = ru
      ? `Символически этот расклад «${spreadName}»${question ? ` по вопросу «${question}»` : ""} указывает на ${toneText}. Этот расклад может подсказывать, что в ближайшие дни стоит обратить внимание на: ${themeList || "перечисленные выше темы"}. ${disclaimer}`
      : `Symbolically, this ${spreadName} reading${question ? ` around "${question}"` : ""} points to ${toneText}. This reading may suggest paying attention to ${themeList || "the themes above"} over the days ahead. ${disclaimer}`;
    const summary = ru
      ? `Расклад «${spreadName}»${question ? ` по вопросу «${question}»` : ""}, подчёркивающий темы: ${themeList || "несколько ключевых тем"}.`
      : `A ${spreadName} reading${question ? ` around "${question}"` : ""}, highlighting ${themeList || "a few key themes"}.`;

    return {
      provider: this.id,
      summary,
      overall,
      cardInterpretations,
      themes,
      advice,
      challenges,
      generatedAt: new Date().toISOString(),
    };
  }
}
