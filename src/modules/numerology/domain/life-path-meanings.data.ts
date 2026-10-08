import type { LifePathMeaning, LifePathMeaningSource, LifePathNumber } from "./types";

export const LIFE_PATH_MEANINGS: Record<LifePathNumber, LifePathMeaningSource> = {
  1: {
    number: 1,
    title: "The Leader",
    titleRu: "Лидер",
    keywords: ["independence", "initiative", "originality"],
    keywordsRu: ["независимость", "инициатива", "оригинальность"],
    description:
      "This may suggest a life shaped by starting things — new paths, new ideas, new ground. Independence tends to matter more than fitting in.",
    descriptionRu:
      "Это может говорить о жизни, построенной на начинаниях — новых путях, новых идеях, новой почве. Независимость, как правило, важнее, чем вписаться в общее.",
    strengths: ["Natural leadership", "Courage to go first", "Self-reliance"],
    strengthsRu: ["Природное лидерство", "Смелость идти первым", "Самостоятельность"],
    challenges: ["Stubbornness", "Impatience with others' pace", "A tendency toward isolation"],
    challengesRu: ["Упрямство", "Нетерпение к чужому темпу", "Склонность к изоляции"],
  },
  2: {
    number: 2,
    title: "The Diplomat",
    titleRu: "Дипломат",
    keywords: ["partnership", "harmony", "sensitivity"],
    keywordsRu: ["партнёрство", "гармония", "чувствительность"],
    description: "One possible interpretation is a life oriented around connection — reading a room, easing tension, building bridges between people.",
    descriptionRu:
      "Одна из возможных трактовок — жизнь, выстроенная вокруг связей: считывать атмосферу, снимать напряжение, строить мосты между людьми.",
    strengths: ["Deep intuition", "Genuine cooperation", "Patience"],
    strengthsRu: ["Глубокая интуиция", "Искреннее сотрудничество", "Терпение"],
    challenges: ["Indecision", "Over-relying on others' approval", "Avoiding necessary conflict"],
    challengesRu: ["Нерешительность", "Чрезмерная зависимость от чужого одобрения", "Уход от необходимых конфликтов"],
  },
  3: {
    number: 3,
    title: "The Communicator",
    titleRu: "Коммуникатор",
    keywords: ["expression", "creativity", "joy"],
    keywordsRu: ["самовыражение", "творчество", "радость"],
    description: "This can point to a life that finds meaning through self-expression — words, art, performance, or simply lighting up a room.",
    descriptionRu:
      "Это может указывать на жизнь, находящую смысл в самовыражении — слове, искусстве, выступлении или просто умении озарить комнату.",
    strengths: ["Charisma", "Artistic instinct", "Optimism"],
    strengthsRu: ["Харизма", "Художественное чутьё", "Оптимизм"],
    challenges: ["Scattered focus", "Surface-level engagement under pressure", "Mood swings"],
    challengesRu: ["Рассеянность внимания", "Поверхностность под давлением", "Перепады настроения"],
  },
  4: {
    number: 4,
    title: "The Builder",
    titleRu: "Строитель",
    keywords: ["stability", "discipline", "structure"],
    keywordsRu: ["стабильность", "дисциплина", "структура"],
    description: "Symbolically, this points toward a life built brick by brick — steady effort, reliable systems, and results that last.",
    descriptionRu:
      "Символически это указывает на жизнь, выстроенную кирпичик за кирпичиком — ровные усилия, надёжные системы и результаты, которые остаются.",
    strengths: ["Reliability", "Organization", "Practical follow-through"],
    strengthsRu: ["Надёжность", "Организованность", "Практичность в доведении дел до конца"],
    challenges: ["Rigidity", "Resistance to change", "Overworking to the point of burnout"],
    challengesRu: ["Жёсткость", "Сопротивление переменам", "Переработки до выгорания"],
  },
  5: {
    number: 5,
    title: "The Free Spirit",
    titleRu: "Свободный дух",
    keywords: ["change", "adventure", "freedom"],
    keywordsRu: ["перемены", "приключения", "свобода"],
    description: "This may suggest a life that resists staying still for long — drawn to new experiences, new places, new versions of itself.",
    descriptionRu:
      "Это может говорить о жизни, которая не терпит долгого стояния на месте: её тянет к новому опыту, новым местам, новым версиям себя.",
    strengths: ["Adaptability", "Curiosity", "Natural charm"],
    strengthsRu: ["Приспособляемость", "Любопытство", "Природное обаяние"],
    challenges: ["Restlessness", "Impulsive decisions", "Difficulty committing"],
    challengesRu: ["Беспокойство", "Импульсивные решения", "Трудности с обязательствами"],
  },
  6: {
    number: 6,
    title: "The Nurturer",
    titleRu: "Заботливый",
    keywords: ["responsibility", "care", "harmony"],
    keywordsRu: ["ответственность", "забота", "гармония"],
    description: "One possible interpretation is a life centered on caretaking — of family, community, or whatever needs tending closest to home.",
    descriptionRu:
      "Одна из возможных трактовок — жизнь, сосредоточенная на заботе: о семье, сообществе или о том, что требует внимания ближе всего к дому.",
    strengths: ["Compassion", "Loyalty", "A gift for creating harmony"],
    strengthsRu: ["Сострадание", "Верность", "Дар создавать гармонию"],
    challenges: ["Self-sacrifice taken too far", "Controlling tendencies", "Perfectionism"],
    challengesRu: ["Чрезмерное самопожертвование", "Склонность к контролю", "Перфекционизм"],
  },
  7: {
    number: 7,
    title: "The Seeker",
    titleRu: "Искатель",
    keywords: ["introspection", "wisdom", "depth"],
    keywordsRu: ["самоанализ", "мудрость", "глубина"],
    description: "This can point to a life oriented inward — questioning, analyzing, and looking for what's true beneath the surface.",
    descriptionRu: "Это может указывать на жизнь, обращённую внутрь: вопросы, анализ и поиск того, что истинно под поверхностью.",
    strengths: ["Analytical depth", "Intuition", "Comfort with solitude"],
    strengthsRu: ["Аналитическая глубина", "Интуиция", "Комфорт в одиночестве"],
    challenges: ["Isolation", "Overthinking", "Skepticism that shuts out connection"],
    challengesRu: ["Изоляция", "Избыточные размышления", "Скептицизм, закрывающий путь к близости"],
  },
  8: {
    number: 8,
    title: "The Powerhouse",
    titleRu: "Движущая сила",
    keywords: ["ambition", "authority", "achievement"],
    keywordsRu: ["амбиции", "авторитет", "достижения"],
    description: "Symbolically, this suggests a life measured in impact — building something substantial, and being recognized for it.",
    descriptionRu: "Символически это говорит о жизни, измеряемой влиянием: создание чего-то значительного и признание за это.",
    strengths: ["Drive", "Business instinct", "Resilience under pressure"],
    strengthsRu: ["Драйв", "Деловая хватка", "Стойкость под давлением"],
    challenges: ["Workaholism", "Overvaluing material success", "Control issues"],
    challengesRu: ["Трудоголизм", "Переоценка материального успеха", "Проблемы с контролем"],
  },
  9: {
    number: 9,
    title: "The Humanitarian",
    titleRu: "Гуманист",
    keywords: ["compassion", "idealism", "completion"],
    keywordsRu: ["сострадание", "идеализм", "завершённость"],
    description: "This may suggest a life oriented toward giving — generous, idealistic, and often more comfortable helping than being helped.",
    descriptionRu:
      "Это может говорить о жизни, обращённой к отдаче: щедрой, идеалистичной, часто более комфортной в роли помогающего, чем принимающего помощь.",
    strengths: ["Generosity", "Broad empathy", "Hard-won wisdom"],
    strengthsRu: ["Щедрость", "Широкая эмпатия", "Заслуженная мудрость"],
    challenges: ["Martyrdom", "Difficulty letting go", "Emotional overwhelm"],
    challengesRu: ["Мученичество", "Трудности с отпусканием", "Эмоциональная перегрузка"],
  },
  11: {
    number: 11,
    title: "The Intuitive",
    titleRu: "Интуит",
    keywords: ["inspiration", "sensitivity", "insight"],
    keywordsRu: ["вдохновение", "чувствительность", "озарение"],
    description:
      "A master number — traditionally read as an amplified version of 2's sensitivity. This can point to a life carried by strong intuition and the ability to inspire others, often at some personal cost.",
    descriptionRu:
      "Мастер-число — традиционно читается как усиленная чувствительность двойки. Это может указывать на жизнь, ведомую сильной интуицией и способностью вдохновлять других, нередко ценой личных затрат.",
    strengths: ["Visionary thinking", "Heightened sensitivity", "Inspiring presence"],
    strengthsRu: ["Видение", "Обострённая чувствительность", "Вдохновляющее присутствие"],
    challenges: ["Nervous energy", "Self-doubt", "Feeling overwhelmed by one's own perception"],
    challengesRu: ["Нервное напряжение", "Сомнения в себе", "Ощущение перегрузки от собственного восприятия"],
  },
  22: {
    number: 22,
    title: "The Master Builder",
    titleRu: "Мастер-строитель",
    keywords: ["vision", "achievement", "legacy"],
    keywordsRu: ["видение", "достижения", "наследие"],
    description:
      "A master number — traditionally read as 4's discipline scaled up. This may suggest a life capable of turning big, abstract visions into something concrete and lasting.",
    descriptionRu:
      "Мастер-число — традиционно читается как дисциплина четвёрки в большем масштабе. Это может говорить о жизни, способной превращать масштабные абстрактные замыслы в нечто конкретное и долговечное.",
    strengths: ["Large-scale vision paired with practical execution", "Natural leadership", "Enduring legacy"],
    strengthsRu: ["Масштабное видение в сочетании с практическим исполнением", "Природное лидерство", "Прочное наследие"],
    challenges: ["Enormous self-imposed pressure", "Self-doubt at a high level", "Burnout"],
    challengesRu: ["Огромное самозаданное давление", "Сомнения в себе на высоком уровне", "Выгорание"],
  },
  33: {
    number: 33,
    title: "The Master Teacher",
    titleRu: "Мастер-учитель",
    keywords: ["compassion", "healing", "service"],
    keywordsRu: ["сострадание", "исцеление", "служение"],
    description:
      "A master number — traditionally read as 6's care scaled up. This can point to a life oriented around healing and teaching on a wide scale, often putting others' wellbeing first.",
    descriptionRu:
      "Мастер-число — традиционно читается как забота шестёрки в большем масштабе. Это может указывать на жизнь, посвящённую исцелению и обучению на широком уровне, нередко с приоритетом чужого благополучия.",
    strengths: ["Deep emotional wisdom", "Nurturing on a grand scale", "Selfless service"],
    strengthsRu: ["Глубокая эмоциональная мудрость", "Забота в большом масштабе", "Бескорыстное служение"],
    challenges: ["Self-neglect", "Unrealistically high standards", "Burnout from over-giving"],
    challengesRu: ["Пренебрежение собой", "Нереалистично высокие стандарты", "Выгорание от чрезмерной отдачи"],
  },
};

/** Запись на запрошенном языке (по умолчанию английский). */
export function getLifePathMeaning(number: LifePathNumber, locale: "en" | "ru" = "en"): LifePathMeaning {
  const source = LIFE_PATH_MEANINGS[number];
  if (locale === "ru") {
    return {
      number: source.number,
      title: source.titleRu,
      keywords: source.keywordsRu,
      description: source.descriptionRu,
      strengths: source.strengthsRu,
      challenges: source.challengesRu,
    };
  }
  return source;
}
