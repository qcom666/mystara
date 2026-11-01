import type { Bilingual } from "./horoscope.data";
import type { ZodiacSignId } from "./types";

/**
 * Данные подробной совместимости (services/detailed-compatibility.ts): черты характера каждого знака и
 * пункты разбора для любви и для дружбы с текстами на три уровня оценки.
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
  | "interests"
  | "understanding"
  | "trust"
  | "support"
  | "adventures"
  | "humor"
  | "reliability"
  | "conflicts"
  | "projects"
  | "freedom"
  | "inspiration"
  | "lasting";

export type AspectBand = "high" | "mid" | "low";

export interface AspectDefinition<Id extends string> {
  id: Id;
  title: Bilingual;
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

export const FRIENDSHIP_ASPECTS: AspectDefinition<FriendshipAspectId>[] = [
  {
    id: "interests",
    weight: 1.1,
    title: { ru: "Общие интересы", en: "Shared interests" },
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
    id: "understanding",
    weight: 1.2,
    title: { ru: "Понимание с полуслова", en: "Understanding each other" },
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
        ru: "Вы смотрите на мир по-разному, поэтому недопонимания случаются. Переспрашивайте, а не додумывайте.",
        en: "You see the world differently, so misunderstandings happen. Ask instead of assuming.",
      },
    },
  },
  {
    id: "trust",
    weight: 1.3,
    title: { ru: "Доверие и секреты", en: "Trust and secrets" },
    text: {
      high: {
        ru: "Такому другу можно доверить что угодно: ваши секреты в надёжных руках.",
        en: "You can trust this friend with anything: your secrets are safe.",
      },
      mid: {
        ru: "Доверие есть, и оно крепнет с каждым испытанием, которое вы проходите вместе.",
        en: "The trust is there, and it grows with every test you go through together.",
      },
      low: {
        ru: "Доверие здесь нужно заслужить: начните с малого и держите слово.",
        en: "Trust has to be earned here: start small and keep your word.",
      },
    },
  },
  {
    id: "support",
    weight: 1.2,
    title: { ru: "Поддержка в трудную минуту", en: "Support in hard times" },
    text: {
      high: {
        ru: "В трудную минуту вы первые, кому звоните друг другу, — и знаете, что вас выслушают.",
        en: "In hard times you're each other's first call — and you know you'll be heard.",
      },
      mid: {
        ru: "Вы поддержите друг друга, хотя утешаете по-разному: один — делом, другой — словом.",
        en: "You'll support each other, though you comfort differently: one with deeds, the other with words.",
      },
      low: {
        ru: "Поддержку вы понимаете по-разному. Спросите прямо, что нужно другу, — так помощь попадёт в цель.",
        en: "You understand support differently. Ask directly what your friend needs — that way help lands.",
      },
    },
  },
  {
    id: "adventures",
    weight: 0.9,
    title: { ru: "Приключения и движ", en: "Adventures" },
    text: {
      high: {
        ru: "С вами не соскучишься: поездки, спонтанные планы и безумные идеи — ваша стихия.",
        en: "Never a dull moment: trips, spontaneous plans and wild ideas are your thing.",
      },
      mid: {
        ru: "Вы с удовольствием куда-то выбираетесь вместе, если кто-то один берёт инициативу.",
        en: "You enjoy going places together, as long as one of you takes the lead.",
      },
      low: {
        ru: "Один рвётся в приключения, другой ценит уют. Чередуйте: вылазка — вечер дома.",
        en: "One craves adventure, the other loves comfort. Alternate: an outing, then a night in.",
      },
    },
  },
  {
    id: "humor",
    weight: 0.9,
    title: { ru: "Юмор", en: "Humour" },
    text: {
      high: {
        ru: "Вы смеётесь над одним и тем же, и у вас уже есть шутки, понятные только вам.",
        en: "You laugh at the same things and already have inside jokes only you understand.",
      },
      mid: {
        ru: "Посмеяться вместе вы умеете, хотя чувство юмора у вас немного разное.",
        en: "You can laugh together, though your senses of humour differ a little.",
      },
      low: {
        ru: "Юмор у вас разный: то, что смешно одному, другого может задеть. Шутите бережно.",
        en: "Your humour differs: what's funny to one can hurt the other. Joke with care.",
      },
    },
  },
  {
    id: "reliability",
    weight: 1,
    title: { ru: "Надёжность", en: "Reliability" },
    text: {
      high: {
        ru: "На вас обоих можно положиться: вы приходите вовремя, помните о важном и держите обещания.",
        en: "You can both be counted on: you show up on time, remember what matters and keep promises.",
      },
      mid: {
        ru: "В целом вы надёжны друг для друга, но в мелочах кто-то может подводить.",
        en: "Overall you're reliable for each other, though one of you may slip on small things.",
      },
      low: {
        ru: "Кто-то из вас живёт моментом, а кто-то — планом. Договаривайтесь заранее и не обижайтесь на спонтанность.",
        en: "One of you lives in the moment, the other by the plan. Agree in advance and don't take spontaneity personally.",
      },
    },
  },
  {
    id: "conflicts",
    weight: 0.9,
    title: { ru: "Ссоры и примирение", en: "Arguments and making up" },
    text: {
      high: {
        ru: "Вы редко ссоритесь, а если ссоритесь — быстро миритесь и не держите зла.",
        en: "You rarely fall out, and when you do, you make up quickly and hold no grudges.",
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
    id: "projects",
    weight: 0.8,
    title: { ru: "Общие дела", en: "Doing things together" },
    text: {
      high: {
        ru: "Вместе вы отличная команда: общий проект, ремонт или идея для бизнеса у вас спорятся.",
        en: "Together you're a great team: a shared project, a renovation or a business idea gets done.",
      },
      mid: {
        ru: "Работать вместе получается, если заранее разделить роли.",
        en: "Working together works once you divide the roles in advance.",
      },
      low: {
        ru: "В делах вы тянете в разные стороны. Дружите — а общие проекты обсуждайте очень подробно.",
        en: "In practical matters you pull in different directions. Stay friends — and discuss joint projects in great detail.",
      },
    },
  },
  {
    id: "freedom",
    weight: 0.8,
    title: { ru: "Личное пространство", en: "Personal space" },
    text: {
      high: {
        ru: "Вы не обижаетесь, если неделю не виделись: дружба от этого не слабеет.",
        en: "You don't mind not seeing each other for a week: the friendship doesn't weaken.",
      },
      mid: {
        ru: "Одному из вас нужно чуть больше общения, чем другому. Обсудите это — и никто не почувствует себя забытым.",
        en: "One of you needs a bit more contact than the other. Talk about it and no one will feel forgotten.",
      },
      low: {
        ru: "Один ждёт постоянной связи, другой пропадает. Договоритесь о ритме, который устроит обоих.",
        en: "One expects constant contact, the other disappears. Agree on a rhythm that suits you both.",
      },
    },
  },
  {
    id: "inspiration",
    weight: 0.8,
    title: { ru: "Вдохновение", en: "Inspiring each other" },
    text: {
      high: {
        ru: "Рядом друг с другом вы загораетесь идеями и решаетесь на то, на что поодиночке бы не пошли.",
        en: "Around each other you catch fire with ideas and dare things you wouldn't alone.",
      },
      mid: {
        ru: "Вы подкидываете друг другу полезные мысли, хотя мечтаете о разном.",
        en: "You give each other useful ideas, though you dream of different things.",
      },
      low: {
        ru: "Цели у вас разные, но это повод увидеть, как живёт человек с другим взглядом на мир.",
        en: "Your goals differ, but that's a chance to see how someone with a different view of the world lives.",
      },
    },
  },
  {
    id: "lasting",
    weight: 1.4,
    title: { ru: "Дружба на годы", en: "Friendship for years" },
    text: {
      high: {
        ru: "Это та дружба, что выдерживает переезды, перемены и годы: у неё крепкий фундамент.",
        en: "This is the kind of friendship that survives moves, changes and years: it has a solid foundation.",
      },
      mid: {
        ru: "Дружба может стать долгой, если оба будут о ней заботиться.",
        en: "The friendship can last if you both look after it.",
      },
      low: {
        ru: "Такая дружба держится на усилиях обоих — но именно поэтому её особенно ценят.",
        en: "This friendship relies on effort from both of you — which is exactly why it's so valued.",
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
