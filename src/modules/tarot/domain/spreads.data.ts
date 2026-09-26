import type { SpreadPosition, TarotSpread } from "./types";

/**
 * Spreads are pure data. The draw engine and layout components both read
 * `cardCount`/`positions` generically — adding a new spread here is the only
 * step required; no engine or (at worst) layout code needs to change (see
 * PROJECT_ARCHITECTURE.md §5).
 */
export const SPREADS: TarotSpread[] = [
  {
    id: "one-card",
    slug: "one-card",
    name: "One Card",
    nameRu: "Одна карта",
    description: "A single card for a quick, focused answer or a daily check-in.",
    descriptionRu: "Одна карта для быстрого, сфокусированного ответа или ежедневной практики.",
    cardCount: 1,
    positions: [
      {
        id: "focus",
        order: 1,
        label: "Focus",
        labelRu: "Фокус",
        meaning: "The single most relevant energy for your question right now.",
        meaningRu: "Самая значимая энергия для вашего вопроса прямо сейчас.",
      },
    ],
    category: "general",
    difficulty: "beginner",
    isPremium: false,
  },
  {
    id: "three-card",
    slug: "three-card",
    name: "Three Card",
    nameRu: "Три карты",
    description: "Past, present, and future — the classic spread for a clear, narrative reading.",
    descriptionRu: "Прошлое, настоящее и будущее — классический расклад для ясного, последовательного толкования.",
    cardCount: 3,
    positions: [
      { id: "past", order: 1, label: "Past", labelRu: "Прошлое", meaning: "What led you here.", meaningRu: "Что привело вас сюда." },
      {
        id: "present",
        order: 2,
        label: "Present",
        labelRu: "Настоящее",
        meaning: "Where things stand right now.",
        meaningRu: "Как обстоят дела прямо сейчас.",
      },
      {
        id: "future",
        order: 3,
        label: "Future",
        labelRu: "Будущее",
        meaning: "Where things may be heading.",
        meaningRu: "К чему всё может привести.",
      },
    ],
    category: "general",
    difficulty: "beginner",
    isPremium: false,
  },
  {
    id: "five-card",
    slug: "five-card",
    name: "Five Card",
    nameRu: "Пять карт",
    description: "A deeper look at a situation: what's happening, what's in the way, and what to do about it.",
    descriptionRu: "Более глубокий взгляд на ситуацию: что происходит, что мешает и что с этим делать.",
    cardCount: 5,
    positions: [
      {
        id: "situation",
        order: 1,
        label: "Situation",
        labelRu: "Ситуация",
        meaning: "The heart of what's going on.",
        meaningRu: "Суть происходящего.",
      },
      {
        id: "challenge",
        order: 2,
        label: "Challenge",
        labelRu: "Препятствие",
        meaning: "What's making this harder.",
        meaningRu: "Что усложняет ситуацию.",
      },
      {
        id: "root",
        order: 3,
        label: "Root",
        labelRu: "Первопричина",
        meaning: "The underlying cause.",
        meaningRu: "Глубинная причина происходящего.",
      },
      { id: "advice", order: 4, label: "Advice", labelRu: "Совет", meaning: "A suggested way forward.", meaningRu: "Предлагаемый путь вперёд." },
      {
        id: "outcome",
        order: 5,
        label: "Outcome",
        labelRu: "Итог",
        meaning: "Where this is likely heading.",
        meaningRu: "К чему это, вероятно, приведёт.",
      },
    ],
    category: "general",
    difficulty: "intermediate",
    isPremium: false,
  },
  {
    id: "yes-no",
    slug: "yes-no",
    name: "Yes / No",
    nameRu: "Да / Нет",
    description: "One card, read for its traditional yes-or-no leaning — best for a direct, simple question.",
    descriptionRu: "Одна карта, прочитанная по её традиционной склонности к «да» или «нет», — подходит для прямого, простого вопроса.",
    cardCount: 1,
    positions: [
      {
        id: "answer",
        order: 1,
        label: "Answer",
        labelRu: "Ответ",
        meaning: "The card's traditional leaning on your question.",
        meaningRu: "Традиционная склонность карты в отношении вашего вопроса.",
      },
    ],
    category: "yes-no",
    difficulty: "beginner",
    isPremium: false,
  },
  {
    id: "love",
    slug: "love",
    name: "Love Spread",
    nameRu: "Расклад на любовь",
    description: "A five-card look at a romantic connection — both sides, the bond between you, and where it can go.",
    descriptionRu: "Расклад на пять карт о романтической связи — обе стороны, связь между вами и куда она может привести.",
    cardCount: 5,
    positions: [
      { id: "you", order: 1, label: "You", labelRu: "Вы", meaning: "Your energy in this connection.", meaningRu: "Ваша энергия в этой связи." },
      {
        id: "partner",
        order: 2,
        label: "Partner",
        labelRu: "Партнёр",
        meaning: "Their energy in this connection.",
        meaningRu: "Энергия партнёра в этой связи.",
      },
      {
        id: "connection",
        order: 3,
        label: "Connection",
        labelRu: "Связь",
        meaning: "What binds you together.",
        meaningRu: "Что вас связывает.",
      },
      {
        id: "challenge",
        order: 4,
        label: "Challenge",
        labelRu: "Испытание",
        meaning: "What's testing the relationship.",
        meaningRu: "Что испытывает отношения на прочность.",
      },
      {
        id: "potential",
        order: 5,
        label: "Potential",
        labelRu: "Потенциал",
        meaning: "Where this connection could go.",
        meaningRu: "Куда может привести эта связь.",
      },
    ],
    category: "love",
    difficulty: "intermediate",
    isPremium: true,
  },
  {
    id: "career",
    slug: "career",
    name: "Career Spread",
    nameRu: "Расклад на карьеру",
    description: "A four-card read on your professional path — situation, obstacle, action, and likely outcome.",
    descriptionRu: "Расклад на четыре карты о вашем профессиональном пути — ситуация, препятствие, действие и вероятный итог.",
    cardCount: 4,
    positions: [
      {
        id: "situation",
        order: 1,
        label: "Current Situation",
        labelRu: "Текущая ситуация",
        meaning: "Where things stand professionally.",
        meaningRu: "Как обстоят дела в профессиональном плане.",
      },
      {
        id: "obstacle",
        order: 2,
        label: "Obstacle",
        labelRu: "Препятствие",
        meaning: "What's standing in your way.",
        meaningRu: "Что стоит у вас на пути.",
      },
      {
        id: "action",
        order: 3,
        label: "Action to Take",
        labelRu: "Действие",
        meaning: "A suggested next move.",
        meaningRu: "Предлагаемый следующий шаг.",
      },
      {
        id: "outcome",
        order: 4,
        label: "Likely Outcome",
        labelRu: "Вероятный итог",
        meaning: "Where this path may lead.",
        meaningRu: "К чему может привести этот путь.",
      },
    ],
    category: "career",
    difficulty: "intermediate",
    isPremium: true,
  },
  {
    id: "celtic-cross",
    slug: "celtic-cross",
    name: "Celtic Cross",
    nameRu: "Кельтский крест",
    description: "The definitive ten-card deep dive — for when a question deserves real depth.",
    descriptionRu: "Классический глубокий расклад на десять карт — для вопросов, заслуживающих настоящей глубины.",
    cardCount: 10,
    positions: [
      {
        id: "present",
        order: 1,
        label: "Heart of the Matter",
        labelRu: "Суть вопроса",
        meaning: "The core of the situation.",
        meaningRu: "Ядро ситуации.",
      },
      {
        id: "challenge",
        order: 2,
        label: "Immediate Challenge",
        labelRu: "Непосредственное препятствие",
        meaning: "What's crossing you right now.",
        meaningRu: "Что противостоит вам прямо сейчас.",
      },
      {
        id: "foundation",
        order: 3,
        label: "Foundation",
        labelRu: "Основа",
        meaning: "The deep, distant past shaping this.",
        meaningRu: "Далёкое прошлое, сформировавшее ситуацию.",
      },
      {
        id: "recentPast",
        order: 4,
        label: "Recent Past",
        labelRu: "Недавнее прошлое",
        meaning: "What's just happened or is passing.",
        meaningRu: "Что только что произошло или уходит.",
      },
      {
        id: "crown",
        order: 5,
        label: "Best Outcome",
        labelRu: "Лучший исход",
        meaning: "The best conscious goal or outcome to aim for.",
        meaningRu: "Лучшая осознанная цель или исход, к которому стоит стремиться.",
      },
      {
        id: "nearFuture",
        order: 6,
        label: "Near Future",
        labelRu: "Ближайшее будущее",
        meaning: "What's coming next.",
        meaningRu: "Что произойдёт дальше.",
      },
      {
        id: "stance",
        order: 7,
        label: "Your Stance",
        labelRu: "Ваша позиция",
        meaning: "How you're approaching this.",
        meaningRu: "Как вы подходите к ситуации.",
      },
      {
        id: "external",
        order: 8,
        label: "External Influences",
        labelRu: "Внешние влияния",
        meaning: "People and circumstances around you.",
        meaningRu: "Люди и обстоятельства вокруг вас.",
      },
      {
        id: "hopesFears",
        order: 9,
        label: "Hopes & Fears",
        labelRu: "Надежды и страхи",
        meaning: "What you're hoping for — and afraid of.",
        meaningRu: "На что вы надеетесь — и чего боитесь.",
      },
      {
        id: "outcome",
        order: 10,
        label: "Final Outcome",
        labelRu: "Итоговый результат",
        meaning: "Where this is heading if the current path continues.",
        meaningRu: "К чему всё придёт, если текущий путь сохранится.",
      },
    ],
    category: "general",
    difficulty: "advanced",
    isPremium: true,
  },
];

const SPREAD_BY_ID = new Map(SPREADS.map((spread) => [spread.id, spread]));

export function getAllSpreads(): readonly TarotSpread[] {
  return SPREADS;
}

export function getSpreadById(id: string): TarotSpread | undefined {
  return SPREAD_BY_ID.get(id);
}

export function requireSpreadById(id: string): TarotSpread {
  const spread = getSpreadById(id);
  if (!spread) {
    throw new Error(`Unknown tarot spread id: "${id}"`);
  }
  return spread;
}

/** Locale-aware accessors — see the matching note in `deck.ts`. */
export function getSpreadName(spread: TarotSpread, locale: "en" | "ru"): string {
  return locale === "ru" ? spread.nameRu : spread.name;
}

export function getSpreadDescription(spread: TarotSpread, locale: "en" | "ru"): string {
  return locale === "ru" ? spread.descriptionRu : spread.description;
}

export function getPositionLabel(position: SpreadPosition, locale: "en" | "ru"): string {
  return locale === "ru" ? position.labelRu : position.label;
}

export function getPositionMeaning(position: SpreadPosition, locale: "en" | "ru"): string {
  return locale === "ru" ? position.meaningRu : position.meaning;
}
