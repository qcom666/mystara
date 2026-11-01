import type { Bilingual } from "./horoscope.data";
import type { ZodiacSignId } from "./types";

/**
 * Данные подробной совместимости (services/detailed-compatibility.ts): черты характера каждого знака,
 * шесть сфер и двенадцать пунктов для любви, одиннадцать пунктов дружбы в четырёх блоках — с текстами на три
 * уровня оценки.
 */

/** Черты знака по шкале 1–10 — традиционные астрологические образы знаков, а не измерения. */
export interface SignTraits {
  /** Страстность, сила влечения. */
  passion: number;
  /** Нежность, эмоциональная отзывчивость. */
  tenderness: number;
  /** Общительность, любовь к разговорам. */
  talk: number;
  /** Верность, привязанность, умение держать слово. */
  loyalty: number;
  /** Практичность, хозяйственность. */
  practicality: number;
  /** Потребность в свободе и личном пространстве. */
  freedom: number;
  /** Лёгкость, юмор, умение веселиться. */
  fun: number;
  /** Упрямство, нежелание уступать. */
  stubborn: number;
  /** Тяга к новому и приключениям. */
  adventure: number;
  /** Целеустремлённость, амбиции. */
  ambition: number;
}

export type TraitId = keyof SignTraits;

export const SIGN_TRAITS: Record<ZodiacSignId, SignTraits> = {
  aries: { passion: 9, tenderness: 4, talk: 6, loyalty: 6, practicality: 4, freedom: 8, fun: 8, stubborn: 6, adventure: 9, ambition: 8 },
  taurus: { passion: 7, tenderness: 7, talk: 4, loyalty: 9, practicality: 9, freedom: 3, fun: 5, stubborn: 9, adventure: 3, ambition: 6 },
  gemini: { passion: 5, tenderness: 4, talk: 10, loyalty: 4, practicality: 4, freedom: 9, fun: 9, stubborn: 3, adventure: 8, ambition: 5 },
  cancer: { passion: 6, tenderness: 10, talk: 6, loyalty: 9, practicality: 6, freedom: 3, fun: 5, stubborn: 6, adventure: 3, ambition: 5 },
  leo: { passion: 9, tenderness: 6, talk: 8, loyalty: 8, practicality: 5, freedom: 6, fun: 9, stubborn: 8, adventure: 7, ambition: 9 },
  virgo: { passion: 4, tenderness: 6, talk: 7, loyalty: 8, practicality: 10, freedom: 4, fun: 5, stubborn: 6, adventure: 3, ambition: 7 },
  libra: { passion: 6, tenderness: 7, talk: 9, loyalty: 6, practicality: 5, freedom: 6, fun: 8, stubborn: 3, adventure: 5, ambition: 5 },
  scorpio: { passion: 10, tenderness: 7, talk: 4, loyalty: 9, practicality: 7, freedom: 5, fun: 4, stubborn: 9, adventure: 6, ambition: 8 },
  sagittarius: { passion: 7, tenderness: 4, talk: 8, loyalty: 5, practicality: 3, freedom: 10, fun: 10, stubborn: 4, adventure: 10, ambition: 6 },
  capricorn: { passion: 5, tenderness: 4, talk: 5, loyalty: 9, practicality: 10, freedom: 5, fun: 4, stubborn: 8, adventure: 3, ambition: 10 },
  aquarius: { passion: 4, tenderness: 4, talk: 8, loyalty: 6, practicality: 5, freedom: 10, fun: 7, stubborn: 7, adventure: 8, ambition: 6 },
  pisces: { passion: 7, tenderness: 10, talk: 5, loyalty: 7, practicality: 3, freedom: 6, fun: 6, stubborn: 2, adventure: 6, ambition: 3 },
};

export type LoveAspectId =
  | "attraction"
  | "emotional"
  | "communication"
  | "trust"
  | "values"
  | "everyday"
  | "tenderness"
  | "conflicts"
  | "fun"
  | "freedom"
  | "growth"
  | "longTerm";

export type FriendshipAspectId =
  | "values"
  | "intellect"
  | "interests"
  | "ease"
  | "safety"
  | "rhythm"
  | "empathy"
  | "reliability"
  | "giveTake"
  | "conflictStyle"
  | "boundaries";

export type AspectBand = "high" | "mid" | "low";

export interface AspectDefinition<Id extends string> {
  id: Id;
  title: Bilingual;
  /** Что этот пункт значит — подпись под названием (у сфер любви и пунктов дружбы). */
  description?: Bilingual;
  /** Пояснение для высокой (от 75 %), средней (55–74 %) и низкой оценки. */
  text: Record<AspectBand, Bilingual>;
  /** Вес пункта в общей оценке. */
  weight: number;
}

export const LOVE_ASPECTS: AspectDefinition<LoveAspectId>[] = [
  {
    id: "attraction",
    weight: 1,
    title: { ru: "Притяжение", en: "Attraction" },
    text: {
      high: {
        ru: "Между вами искрит с первой встречи: вас тянет друг к другу, и эта тяга не гаснет со временем.",
        en: "Sparks fly from the first meeting: you're drawn to each other, and the pull doesn't fade with time.",
      },
      mid: {
        ru: "Притяжение есть, но разгорается постепенно — через общие впечатления и внимание друг к другу.",
        en: "The attraction is there, but it builds gradually, through shared experiences and attention to each other.",
      },
      low: {
        ru: "Страсть здесь не вспыхивает сама: её нужно разжигать — сюрпризами, свиданиями, новизной.",
        en: "Passion doesn't ignite on its own here: it needs kindling — surprises, dates, something new.",
      },
    },
  },
  {
    id: "emotional",
    weight: 1.3,
    title: { ru: "Эмоциональная близость", en: "Emotional closeness" },
    text: {
      high: {
        ru: "Вы чувствуете настроение друг друга без слов и умеете быть рядом, когда это нужно.",
        en: "You sense each other's moods without words and know how to be there when it counts.",
      },
      mid: {
        ru: "Близость складывается, но иногда одному из вас нужно больше тепла, чем другой привык давать.",
        en: "Closeness grows, but sometimes one of you needs more warmth than the other is used to giving.",
      },
      low: {
        ru: "Вы по-разному выражаете чувства, и это легко принять за холодность. Говорите о том, что чувствуете, прямо.",
        en: "You express feelings differently, and it's easy to mistake that for coldness. Say what you feel out loud.",
      },
    },
  },
  {
    id: "communication",
    weight: 1.1,
    title: { ru: "Общение", en: "Communication" },
    text: {
      high: {
        ru: "Разговоры текут легко: вы понимаете друг друга с полуслова и можете обсуждать что угодно часами.",
        en: "Conversation flows: you understand each other instantly and can talk about anything for hours.",
      },
      mid: {
        ru: "Общий язык находится, но иногда вы слышите в словах друг друга не то, что было сказано.",
        en: "You find common ground, though sometimes you hear something other than what was actually said.",
      },
      low: {
        ru: "Вы говорите на разных языках: один — фактами, другой — чувствами. Переспрашивайте, прежде чем обижаться.",
        en: "You speak different languages: one in facts, the other in feelings. Ask before taking offence.",
      },
    },
  },
  {
    id: "trust",
    weight: 1.3,
    title: { ru: "Доверие и верность", en: "Trust and loyalty" },
    text: {
      high: {
        ru: "Оба цените верность и держите слово, поэтому доверие между вами крепкое и спокойное.",
        en: "You both value loyalty and keep your word, so the trust between you is solid and calm.",
      },
      mid: {
        ru: "Доверие строится постепенно: ему помогают открытость и выполненные обещания.",
        en: "Trust builds step by step: openness and kept promises help it grow.",
      },
      low: {
        ru: "Один из вас ценит свободу больше, чем другому спокойно. Договоритесь о границах заранее.",
        en: "One of you values freedom more than the other is comfortable with. Agree on boundaries early.",
      },
    },
  },
  {
    id: "values",
    weight: 1.1,
    title: { ru: "Общие ценности", en: "Shared values" },
    text: {
      high: {
        ru: "Вы хотите от жизни похожего, поэтому общие планы и решения даются легко.",
        en: "You want similar things from life, so shared plans and decisions come easily.",
      },
      mid: {
        ru: "В главном вы сходитесь, а в деталях приоритеты расходятся — это повод для честных разговоров.",
        en: "You agree on the big things while the details differ — a reason for honest conversations.",
      },
      low: {
        ru: "Ваши приоритеты заметно различаются. Пара держится, когда вы уважаете цели друг друга, а не переделываете их.",
        en: "Your priorities differ noticeably. The pair holds when you respect each other's goals rather than trying to change them.",
      },
    },
  },
  {
    id: "everyday",
    weight: 0.9,
    title: { ru: "Быт и совместная жизнь", en: "Everyday life together" },
    text: {
      high: {
        ru: "В быту вы ладите на удивление: распределить дела, обустроить дом и вести бюджет вместе — легко.",
        en: "You get along remarkably well day to day: sharing chores, making a home and running a budget come easily.",
      },
      mid: {
        ru: "Быт налаживается, если сразу договориться, кто за что отвечает.",
        en: "Daily life runs smoothly once you agree who's responsible for what.",
      },
      low: {
        ru: "Привычки и ритмы у вас разные — от порядка до денег. Здесь помогают ясные договорённости, а не намёки.",
        en: "Your habits and rhythms differ — from tidiness to money. Clear agreements work better than hints.",
      },
    },
  },
  {
    id: "tenderness",
    weight: 1,
    title: { ru: "Нежность и чувственность", en: "Tenderness and sensuality" },
    text: {
      high: {
        ru: "Вам легко быть нежными друг с другом: прикосновения, забота и внимание здесь естественны.",
        en: "Tenderness comes easily: touch, care and attention feel natural between you.",
      },
      mid: {
        ru: "Чувственность раскрывается со временем, когда вы узнаёте, что важно другому.",
        en: "Sensuality unfolds over time as you learn what matters to the other.",
      },
      low: {
        ru: "Вы по-разному понимаете нежность. Спросите, в чём партнёр чувствует любовь, — ответ может удивить.",
        en: "You understand tenderness differently. Ask how your partner feels loved — the answer may surprise you.",
      },
    },
  },
  {
    id: "conflicts",
    weight: 1,
    title: { ru: "Как вы решаете споры", en: "Handling arguments" },
    text: {
      high: {
        ru: "Ссоры у вас редкие и короткие: вы умеете уступать и быстро мириться.",
        en: "Arguments are rare and short: you know how to give way and make up quickly.",
      },
      mid: {
        ru: "Споры случаются, но компромисс находится, если никто не упирается из принципа.",
        en: "Disagreements happen, but you find compromise as long as neither digs in on principle.",
      },
      low: {
        ru: "Оба с характером, и спор легко превращается в борьбу. Договоритесь о паузе, прежде чем продолжать.",
        en: "You both have strong wills, and an argument easily turns into a contest. Agree to pause before carrying on.",
      },
    },
  },
  {
    id: "fun",
    weight: 0.8,
    title: { ru: "Лёгкость и юмор", en: "Fun and humour" },
    text: {
      high: {
        ru: "С вами весело: общие шутки, спонтанные планы и умение смеяться даже над трудностями.",
        en: "You have fun together: shared jokes, spontaneous plans and the ability to laugh even at trouble.",
      },
      mid: {
        ru: "Вам бывает весело вместе, но одному из вас иногда хочется больше лёгкости.",
        en: "You enjoy yourselves together, though one of you sometimes wants more lightness.",
      },
      low: {
        ru: "Чувство юмора у вас разное, и то, что смешно одному, может задеть другого. Шутите бережно.",
        en: "Your senses of humour differ, and what's funny to one can sting the other. Be gentle with jokes.",
      },
    },
  },
  {
    id: "freedom",
    weight: 0.8,
    title: { ru: "Свобода и личное пространство", en: "Freedom and personal space" },
    text: {
      high: {
        ru: "Вы одинаково понимаете, сколько быть вместе, а сколько — порознь, и не душите друг друга.",
        en: "You agree on how much time to spend together and apart, and you don't smother each other.",
      },
      mid: {
        ru: "Потребность в свободе у вас немного разная. Оставляйте друг другу время на своё — отношения от этого выиграют.",
        en: "Your need for freedom differs a little. Leave room for each other's own things — the relationship will benefit.",
      },
      low: {
        ru: "Одному нужно много свободы, другому — много близости. Ищите баланс открыто, а не через обиды.",
        en: "One needs plenty of freedom, the other plenty of closeness. Find the balance openly, not through resentment.",
      },
    },
  },
  {
    id: "growth",
    weight: 0.8,
    title: { ru: "Рост вместе", en: "Growing together" },
    text: {
      high: {
        ru: "Вы вдохновляете друг друга: рядом с партнёром хочется ставить цели и становиться лучше.",
        en: "You inspire each other: next to your partner you want to set goals and become better.",
      },
      mid: {
        ru: "Вы поддерживаете стремления друг друга, хотя каждый движется в своём темпе.",
        en: "You support each other's ambitions, though each of you moves at your own pace.",
      },
      low: {
        ru: "Стремления у вас разные, и легко тянуть одеяло на себя. Радуйтесь успехам друг друга, даже если они не ваши.",
        en: "Your ambitions differ, and it's easy to pull in your own direction. Celebrate each other's wins, even when they aren't yours.",
      },
    },
  },
  {
    id: "longTerm",
    weight: 1.4,
    title: { ru: "Перспектива на годы", en: "Long-term potential" },
    text: {
      high: {
        ru: "У пары крепкий фундамент: доверие, общие ценности и умение договариваться дают шанс на долгий союз.",
        en: "This pair has a solid foundation: trust, shared values and the ability to agree give a real chance at a lasting union.",
      },
      mid: {
        ru: "У отношений хорошие шансы, если оба готовы вкладываться и обсуждать сложное.",
        en: "The relationship has good chances if you're both willing to invest and talk through hard things.",
      },
      low: {
        ru: "Долгий союз здесь возможен, но потребует осознанной работы от обоих.",
        en: "A lasting union is possible here, but it will take conscious work from both of you.",
      },
    },
  },
];

export type LoveSphereId = "psyche" | "worldview" | "family" | "intellect" | "material" | "physical";

/**
 * Шесть сфер совместимости в любви — крупный план над подробными пунктами. У каждой есть определение (что
 * эта сфера значит) и пояснение для пары на трёх уровнях.
 */
export const LOVE_SPHERES: AspectDefinition<LoveSphereId>[] = [
  {
    id: "psyche",
    weight: 1,
    title: { ru: "Эмоциональная и психологическая", en: "Emotional and psychological" },
    description: {
      ru: "Спокойное принятие особенностей друг друга без постоянного раздражения, чувство безопасности и доверия.",
      en: "Calm acceptance of each other's quirks without constant irritation, a sense of safety and trust.",
    },
    text: {
      high: {
        ru: "Вам спокойно друг с другом: особенности партнёра не раздражают, а рядом с ним чувствуешь себя в безопасности.",
        en: "You feel at ease together: your partner's quirks don't grate, and you feel safe by their side.",
      },
      mid: {
        ru: "В целом вам спокойно вместе, но некоторые привычки друг друга требуют терпения и разговора.",
        en: "On the whole you're at peace together, but some of each other's habits call for patience and a talk.",
      },
      low: {
        ru: "Характеры здесь задевают друг друга. Спокойствие придёт, когда вы научитесь называть раздражение вслух, а не копить его.",
        en: "Your temperaments rub against each other. Calm comes once you learn to name irritation out loud instead of storing it up.",
      },
    },
  },
  {
    id: "worldview",
    weight: 1,
    title: { ru: "Ценностная (духовная)", en: "Values and worldview" },
    description: {
      ru: "Общие взгляды на жизнь, религию, политику, мораль и основные жизненные цели.",
      en: "Shared views on life, religion, politics, morality and your main goals in life.",
    },
    text: {
      high: {
        ru: "Вы смотрите на жизнь похоже: в главных вопросах — что правильно, ради чего жить и куда идти — вы на одной стороне.",
        en: "You see life in a similar way: on the big questions — what's right, what to live for, where to go — you're on the same side.",
      },
      mid: {
        ru: "В главном вы совпадаете, а в отдельных вопросах — от веры до политики — взгляды расходятся. Уважение здесь важнее согласия.",
        en: "You agree on the essentials, while on some questions — from faith to politics — your views differ. Respect matters more than agreement.",
      },
      low: {
        ru: "Взгляды на жизнь у вас заметно разные. Союз держится, когда вы не пытаетесь переубедить друг друга.",
        en: "Your outlooks differ noticeably. The union holds when you stop trying to convert each other.",
      },
    },
  },
  {
    id: "family",
    weight: 1,
    title: { ru: "Семейно-ролевая", en: "Family and roles" },
    description: {
      ru: "Понимание того, каким должен быть брак, кто и как ведёт хозяйство, распределяет роли и воспитывает детей.",
      en: "Your idea of what marriage should be, who runs the household and how, how roles are shared and children raised.",
    },
    text: {
      high: {
        ru: "Вы похоже представляете семью: роли распределяются естественно, без борьбы за то, кто главный.",
        en: "You picture family life in a similar way: roles fall into place naturally, with no struggle over who's in charge.",
      },
      mid: {
        ru: "Представления о семье в целом совпадают, но о ролях и воспитании лучше договориться заранее.",
        en: "Your ideas of family broadly match, but it's best to agree on roles and parenting in advance.",
      },
      low: {
        ru: "Вы по-разному видите семью и роли в ней. Обсудите это на берегу — до общего быта и детей.",
        en: "You see family and roles in it differently. Talk it through early — before shared housekeeping and children.",
      },
    },
  },
  {
    id: "intellect",
    weight: 1,
    title: { ru: "Интеллектуальная", en: "Intellectual" },
    description: {
      ru: "Схожий уровень восприятия информации, интерес к беседам друг с другом и уважение к мыслям партнёра.",
      en: "A similar way of taking in information, interest in talking to each other and respect for your partner's thoughts.",
    },
    text: {
      high: {
        ru: "Вам интересно друг с другом: вы думаете в одном темпе, спорите с удовольствием и уважаете мнение партнёра.",
        en: "You find each other interesting: you think at the same pace, enjoy a debate and respect each other's opinions.",
      },
      mid: {
        ru: "Общих тем хватает, хотя думаете вы по-разному: один — быстро и широко, другой — глубоко и основательно.",
        en: "There's plenty to talk about, though you think differently: one fast and broad, the other deep and thorough.",
      },
      low: {
        ru: "Интеллектуально вы на разных волнах. Помогает искренний интерес к тому, чем живёт голова партнёра.",
        en: "Intellectually you're on different wavelengths. Genuine curiosity about what's on your partner's mind helps.",
      },
    },
  },
  {
    id: "material",
    weight: 1,
    title: { ru: "Материально-бытовая", en: "Money and household" },
    description: {
      ru: "Совпадение взглядов на деньги, общий или раздельный бюджет, траты и бытовые привычки.",
      en: "Matching views on money, a joint or separate budget, spending and household habits.",
    },
    text: {
      high: {
        ru: "В деньгах и быту у вас редкое согласие: похожие привычки, траты и представления о порядке.",
        en: "You're in rare agreement on money and home: similar habits, spending and ideas of order.",
      },
      mid: {
        ru: "О деньгах и быте вы договоритесь, если сразу решите, какой бюджет общий, а какой — у каждого свой.",
        en: "You'll agree on money and housework once you decide what budget is shared and what's each person's own.",
      },
      low: {
        ru: "Отношение к деньгам и порядку у вас разное — частый повод для споров. Помогают прозрачные правила.",
        en: "You treat money and order differently — a frequent source of arguments. Clear rules help.",
      },
    },
  },
  {
    id: "physical",
    weight: 1,
    title: { ru: "Физическая и сексуальная", en: "Physical and sexual" },
    description: {
      ru: "Биологическая и психологическая гармония в интимной жизни, схожий темперамент.",
      en: "Biological and psychological harmony in your intimate life, a similar temperament.",
    },
    text: {
      high: {
        ru: "Между вами сильная физическая гармония: похожий темперамент и естественное влечение.",
        en: "There's strong physical harmony between you: a similar temperament and natural desire.",
      },
      mid: {
        ru: "Физическая близость складывается, хотя темпераменты у вас немного разные — важно говорить о желаниях.",
        en: "Physical closeness comes together, though your temperaments differ a little — talking about desires matters.",
      },
      low: {
        ru: "Темпераменты у вас разные, и гармония в интимной жизни требует внимания и открытого разговора.",
        en: "Your temperaments differ, and harmony in your intimate life needs attention and open conversation.",
      },
    },
  },
];

export type FriendshipGroupId = "base" | "comfort" | "behavior" | "conflict";

export const FRIENDSHIP_GROUPS: { id: FriendshipGroupId; title: Bilingual }[] = [
  { id: "base", title: { ru: "Ценностная и интеллектуальная база", en: "Values and intellect" } },
  { id: "comfort", title: { ru: "Психологический комфорт и общение", en: "Psychological comfort and communication" } },
  { id: "behavior", title: { ru: "Поведение и эмоции", en: "Behaviour and emotions" } },
  { id: "conflict", title: { ru: "Конфликтная совместимость", en: "Handling conflict" } },
];

/** Пункты дружбы, сгруппированные в четыре блока (FRIENDSHIP_GROUPS). */
export const FRIENDSHIP_ASPECTS: (AspectDefinition<FriendshipAspectId> & { group: FriendshipGroupId })[] = [
  {
    id: "values",
    group: "base",
    weight: 1.2,
    title: { ru: "Общность жизненных ориентиров", en: "Shared outlook on life" },
    description: {
      ru: "Совпадение базовых представлений о добре, честности, морали и отношении к людям.",
      en: "Matching basic ideas about kindness, honesty, morality and how to treat people.",
    },
    text: {
      high: {
        ru: "Вы одинаково понимаете, что честно и правильно, — на таком фундаменте дружба стоит крепко.",
        en: "You share the same sense of what's honest and right — a firm foundation for a friendship.",
      },
      mid: {
        ru: "В главном ваши ценности совпадают, а в частностях вы смотрите по-разному — и это нормально.",
        en: "Your core values match, while on details you see things differently — and that's fine.",
      },
      low: {
        ru: "Представления о правильном у вас разные. Дружба держится на уважении к чужому взгляду.",
        en: "Your ideas of what's right differ. The friendship rests on respect for the other's view.",
      },
    },
  },
  {
    id: "intellect",
    group: "base",
    weight: 1,
    title: { ru: "Интеллектуальный резонанс", en: "Intellectual resonance" },
    description: {
      ru: "Разговор «на одном языке»: схожая скорость мышления, глубина суждений и чувство юмора.",
      en: "Speaking the same language: a similar pace of thought, depth of judgement and sense of humour.",
    },
    text: {
      high: {
        ru: "Вы говорите на одном языке: одинаковый темп мысли, глубина разговоров и чувство юмора.",
        en: "You speak the same language: the same pace of thought, depth of conversation and sense of humour.",
      },
      mid: {
        ru: "Поговорить вам есть о чём, хотя порой один думает быстрее, а другой — глубже.",
        en: "You have plenty to talk about, though sometimes one thinks faster and the other deeper.",
      },
      low: {
        ru: "Думаете вы по-разному, и разговор клеится не всегда. Зато каждый может показать другому новый взгляд.",
        en: "You think differently, and conversation doesn't always click. But each of you can show the other a new perspective.",
      },
    },
  },
  {
    id: "interests",
    group: "base",
    weight: 0.8,
    title: { ru: "Совпадение интересов", en: "Shared interests" },
    description: {
      ru: "Общие хобби, увлечения и темы — и, главное, взаимный интерес к жизни друг друга.",
      en: "Shared hobbies, passions and topics — and, above all, real interest in each other's lives.",
    },
    text: {
      high: {
        ru: "Вам интересны одни и те же вещи, поэтому повод встретиться находится всегда.",
        en: "You're into the same things, so there's always a reason to meet up.",
      },
      mid: {
        ru: "Общие темы есть, а различия во вкусах только расширяют кругозор обоих.",
        en: "You share some topics, and different tastes broaden both your horizons.",
      },
      low: {
        ru: "Интересы у вас разные — зато каждый может открыть другому новый мир.",
        en: "Your interests differ — but each of you can open up a new world for the other.",
      },
    },
  },
  {
    id: "ease",
    group: "comfort",
    weight: 1.1,
    title: { ru: "Лёгкость в общении", en: "Ease of communication" },
    description: {
      ru: "Никакой неловкости в молчании и не нужно подбирать слова: общение течёт само.",
      en: "No awkwardness in silence and no need to choose your words: conversation simply flows.",
    },
    text: {
      high: {
        ru: "Вы понимаете друг друга с полуслова и можете молчать вместе без неловкости.",
        en: "You get each other instantly and can be silent together without awkwardness.",
      },
      mid: {
        ru: "Обычно вы на одной волне, но иногда приходится объяснять, что вы имели в виду.",
        en: "Usually you're on the same wavelength, though sometimes you have to explain what you meant.",
      },
      low: {
        ru: "Вы смотрите на мир по-разному, и недопонимания случаются. Переспрашивайте, а не додумывайте.",
        en: "You see the world differently, so misunderstandings happen. Ask instead of assuming.",
      },
    },
  },
  {
    id: "safety",
    group: "comfort",
    weight: 1.2,
    title: { ru: "Эмоциональная безопасность", en: "Emotional safety" },
    description: {
      ru: "Можно быть собой и делиться страхами, слабостями и глупыми мыслями без страха осуждения.",
      en: "You can be yourself and share fears, weaknesses and silly thoughts without fear of judgement.",
    },
    text: {
      high: {
        ru: "С этим другом можно быть собой: делиться страхами и самыми странными мыслями, не боясь осуждения.",
        en: "With this friend you can be yourself: share fears and the oddest thoughts without fear of judgement.",
      },
      mid: {
        ru: "Открываться друг другу вы можете, но некоторым темам нужны время и доверие.",
        en: "You can open up to each other, but some topics need time and trust.",
      },
      low: {
        ru: "Кто-то из вас резковат в оценках, и открываться страшновато. Договоритесь не критиковать то, чем делятся по секрету.",
        en: "One of you can be blunt, which makes opening up a little scary. Agree not to criticise what's shared in confidence.",
      },
    },
  },
  {
    id: "rhythm",
    group: "comfort",
    weight: 0.9,
    title: { ru: "Схожий стиль общения", en: "Similar communication style" },
    description: {
      ru: "Обоих устраивают темп и формат: созваниваться каждый день или видеться раз в месяц.",
      en: "You're both happy with the pace and format: daily calls or a meet-up once a month.",
    },
    text: {
      high: {
        ru: "Вам подходит один и тот же ритм: сколько общаться и как часто видеться — вопросов не возникает.",
        en: "The same rhythm suits you both: how much to talk and how often to meet is never an issue.",
      },
      mid: {
        ru: "Ритм общения у вас немного разный. Договоритесь, как часто созваниваться, — и никто не почувствует себя забытым.",
        en: "Your rhythm of contact differs a little. Agree how often to call — and no one will feel forgotten.",
      },
      low: {
        ru: "Один ждёт связи каждый день, другому хватает встречи раз в месяц. Найдите формат, удобный обоим.",
        en: "One expects daily contact, the other is happy with a monthly meet-up. Find a format that suits you both.",
      },
    },
  },
  {
    id: "empathy",
    group: "behavior",
    weight: 1,
    title: { ru: "Уровень эмпатии", en: "Empathy" },
    description: {
      ru: "Искренняя радость за успехи друга без зависти и сопереживание в трудную минуту.",
      en: "Genuine joy at a friend's success without envy, and compassion in hard times.",
    },
    text: {
      high: {
        ru: "Вы искренне радуетесь успехам друг друга и рядом, когда трудно, — без капли зависти.",
        en: "You genuinely celebrate each other's successes and are there when things are hard — without a trace of envy.",
      },
      mid: {
        ru: "Сочувствовать вы умеете, хотя выражаете это по-разному: один словами, другой делом.",
        en: "You can empathise, though you show it differently: one with words, the other with deeds.",
      },
      low: {
        ru: "Сопереживание даётся вам не сразу. Спрашивайте, как дела, и выслушивайте ответ до конца.",
        en: "Empathy doesn't come instantly to you. Ask how things are going and hear the answer out.",
      },
    },
  },
  {
    id: "reliability",
    group: "behavior",
    weight: 1.3,
    title: { ru: "Надёжность и поддержка", en: "Reliability and support" },
    description: {
      ru: "Готовность прийти на помощь, держать слово и хранить секреты. Доверие — главный признак совместимости.",
      en: "Readiness to help, keep your word and keep secrets. Trust is the main sign of compatibility.",
    },
    text: {
      high: {
        ru: "На вас обоих можно положиться: вы приходите на помощь, держите слово и храните секреты.",
        en: "You can both be counted on: you come to help, keep your word and keep secrets.",
      },
      mid: {
        ru: "В целом вы надёжны друг для друга, хотя в мелочах кто-то может подводить.",
        en: "Overall you're reliable for each other, though one of you may slip on small things.",
      },
      low: {
        ru: "Кто-то из вас живёт моментом, а кто-то — планом. Договаривайтесь заранее и не обижайтесь на спонтанность.",
        en: "One of you lives in the moment, the other by the plan. Agree in advance and don't take spontaneity personally.",
      },
    },
  },
  {
    id: "giveTake",
    group: "behavior",
    weight: 1,
    title: { ru: "Баланс «брать — отдавать»", en: "Give-and-take balance" },
    description: {
      ru: "Взаимный обмен временем, вниманием и поддержкой — без вечного «спасателя» и того, кто только берёт.",
      en: "A mutual exchange of time, attention and support — no permanent rescuer and no one who only takes.",
    },
    text: {
      high: {
        ru: "Вы отдаёте друг другу поровну — время, внимание, поддержку, — и никто не чувствует себя использованным.",
        en: "You give each other equally — time, attention, support — and no one feels used.",
      },
      mid: {
        ru: "Баланс в целом есть, но иногда один отдаёт больше. Замечайте это и благодарите.",
        en: "There's broadly a balance, but sometimes one gives more. Notice it and say thank you.",
      },
      low: {
        ru: "Есть риск, что один станет вечным «спасателем», а другой будет только брать. Следите за равновесием.",
        en: "There's a risk one becomes the permanent rescuer and the other only takes. Keep an eye on the balance.",
      },
    },
  },
  {
    id: "conflictStyle",
    group: "conflict",
    weight: 1,
    title: { ru: "Стиль разрешения споров", en: "How you resolve disputes" },
    description: {
      ru: "Умение обсуждать недопонимания спокойно, без перехода на личности и пассивной агрессии, прощать и уступать.",
      en: "Discussing misunderstandings calmly, without personal attacks or passive aggression, and being able to forgive and compromise.",
    },
    text: {
      high: {
        ru: "Вы редко ссоритесь, а если ссоритесь — спокойно обсуждаете, быстро миритесь и не держите зла.",
        en: "You rarely fall out, and when you do, you talk it through calmly, make up quickly and hold no grudges.",
      },
      mid: {
        ru: "Споры бывают, но дружба их выдерживает, если не копить обиды.",
        en: "Disagreements happen, but the friendship survives them as long as you don't bottle up resentment.",
      },
      low: {
        ru: "Оба с характером, и спор легко заходит далеко. Остыньте, прежде чем выяснять отношения.",
        en: "You both have strong characters, and arguments easily go too far. Cool down before having it out.",
      },
    },
  },
  {
    id: "boundaries",
    group: "conflict",
    weight: 0.9,
    title: { ru: "Уважение к личным границам", en: "Respect for boundaries" },
    description: {
      ru: "Принятие чужого «нет»: никаких обид, если друг занят или хочет побыть один.",
      en: "Accepting the other's 'no': no hard feelings if a friend is busy or wants to be alone.",
    },
    text: {
      high: {
        ru: "Вы спокойно принимаете чужое «нет»: никто не обижается, если другой занят или хочет побыть один.",
        en: "You calmly accept each other's 'no': nobody's hurt if the other is busy or wants to be alone.",
      },
      mid: {
        ru: "Иногда отказ задевает одного из вас. Проговаривайте: «нет» — это не про отношение к другу.",
        en: "Sometimes a refusal stings one of you. Say it out loud: a 'no' isn't about how you feel about your friend.",
      },
      low: {
        ru: "Один легко обижается на отказ, другой бережёт своё время превыше всего. Уважайте границы друг друга.",
        en: "One is easily hurt by a refusal, the other guards their time above all. Respect each other's boundaries.",
      },
    },
  },
];

/** Итог по общей оценке: пороги 85, 75, 65, 55 %. */
export const LOVE_VERDICTS: { min: number; text: Bilingual }[] = [
  { min: 85, text: { ru: "Созданы друг для друга", en: "Made for each other" } },
  { min: 75, text: { ru: "Сильная пара", en: "A strong match" } },
  { min: 65, text: { ru: "Хорошие шансы", en: "Good chances" } },
  { min: 55, text: { ru: "Союз, который нужно строить", en: "A bond worth building" } },
  { min: 0, text: { ru: "Непростой, но возможный союз", en: "Challenging but possible" } },
];

export const FRIENDSHIP_VERDICTS: { min: number; text: Bilingual }[] = [
  { min: 85, text: { ru: "Друзья навсегда", en: "Friends for life" } },
  { min: 75, text: { ru: "Крепкая дружба", en: "A strong friendship" } },
  { min: 65, text: { ru: "Хорошие приятели", en: "Good companions" } },
  { min: 55, text: { ru: "Дружба, которая требует сил", en: "A friendship that takes effort" } },
  { min: 0, text: { ru: "Очень разные — и этим интересны", en: "Very different — and interesting for it" } },
];
