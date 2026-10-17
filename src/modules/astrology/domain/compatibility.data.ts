import type { Bilingual } from "./horoscope.data";
import type { Element, Modality } from "./types";

/**
 * Тексты совместимости знаков (см. services/compatibility.ts). Основа — расстояние между знаками по
 * кругу зодиака (тот же знак, соседи, секстиль, квадрат, трин, квинконс, оппозиция), к нему добавляются
 * сочетание стихий и сочетание крестов (кардинальный, фиксированный, мутабельный).
 */

export type SignDistance = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface DistanceProfile {
  /** Базовая оценка пары, %, от неё считаются оценки любви, дружбы и работы. */
  score: number;
  title: Bilingual;
  summary: Bilingual;
  advice: Bilingual;
}

export const DISTANCE_PROFILES: Record<SignDistance, DistanceProfile> = {
  0: {
    score: 72,
    title: { en: "A mirror", ru: "Зеркало" },
    summary: {
      en: "Two people of the same sign understand each other without words: the same rhythm, the same values, the same sense of humour. The catch is that you share your blind spots too, and neither of you balances the other.",
      ru: "Двое людей одного знака понимают друг друга без слов: общий ритм, общие ценности, одинаковое чувство юмора. Подвох в том, что и слабые места у вас общие, и уравновесить друг друга некому.",
    },
    advice: {
      en: "Agree in advance who leads in which area, and keep bringing fresh experiences in from outside.",
      ru: "Заранее договоритесь, кто в чём ведёт, и приносите в пару новые впечатления извне.",
    },
  },
  1: {
    score: 55,
    title: { en: "Neighbours", ru: "Соседи" },
    summary: {
      en: "Neighbouring signs belong to different elements and see the world differently, yet each has something the other lacks. The bond grows gradually, through curiosity rather than instant attraction.",
      ru: "Соседние знаки относятся к разным стихиям и смотрят на мир по-разному, но у каждого есть то, чего не хватает другому. Связь растёт постепенно, через интерес, а не через мгновенное притяжение.",
    },
    advice: {
      en: "Treat your differences as something to learn from, not something to fix.",
      ru: "Относитесь к различиям как к тому, чему можно научиться, а не как к тому, что нужно исправить.",
    },
  },
  2: {
    score: 80,
    title: { en: "Easy allies", ru: "Лёгкие союзники" },
    summary: {
      en: "Your elements feed each other, so conversation flows and shared plans come together easily. This is a friendly, supportive pairing where a little effort brings a lot of warmth.",
      ru: "Ваши стихии питают друг друга, поэтому разговор течёт легко, а общие планы складываются сами собой. Это дружеское, поддерживающее сочетание: небольшие усилия приносят много тепла.",
    },
    advice: {
      en: "Don't take the ease for granted: make time for shared goals, not only for pleasant conversation.",
      ru: "Не принимайте лёгкость как должное: находите время для общих целей, а не только для приятных разговоров.",
    },
  },
  3: {
    score: 45,
    title: { en: "Sparks and friction", ru: "Искры и трение" },
    summary: {
      en: "You act in similar ways but want different things, and that creates tension. It can wear you out, or it can push you both to grow; a lot depends on how you argue.",
      ru: "У вас похожая манера действовать, но разные желания, и это создаёт напряжение. Оно может изматывать, а может подталкивать обоих к росту: многое зависит от того, как вы спорите.",
    },
    advice: {
      en: "Argue about the issue, not about each other, and celebrate every compromise you reach.",
      ru: "Спорьте о деле, а не друг о друге, и отмечайте каждый найденный компромисс.",
    },
  },
  4: {
    score: 90,
    title: { en: "Natural harmony", ru: "Естественная гармония" },
    summary: {
      en: "You belong to the same element and speak the same emotional language. Being together feels easy and familiar, and support comes naturally.",
      ru: "Вы принадлежите одной стихии и говорите на одном эмоциональном языке. Вам легко и привычно вместе, а поддержка возникает сама собой.",
    },
    advice: {
      en: "Comfort can turn into routine: keep surprising each other.",
      ru: "Уют может превратиться в рутину: продолжайте удивлять друг друга.",
    },
  },
  5: {
    score: 40,
    title: { en: "Different wavelengths", ru: "Разные волны" },
    summary: {
      en: "Your signs share neither element nor rhythm, so you often misread each other's intentions. The pairing works when both are willing to adjust and to explain themselves.",
      ru: "У ваших знаков нет общего ни в стихии, ни в ритме, поэтому вы часто неверно понимаете намерения друг друга. Такая пара работает, когда оба готовы подстраиваться и объяснять себя.",
    },
    advice: {
      en: "Spell out your needs directly: what is obvious to you may not be obvious to the other person.",
      ru: "Проговаривайте свои потребности прямо: очевидное для вас может быть неочевидно для другого.",
    },
  },
  6: {
    score: 70,
    title: { en: "Attraction of opposites", ru: "Притяжение противоположностей" },
    summary: {
      en: "You stand on opposite sides of the zodiac, and each has what the other lacks. The attraction is strong, and so is the temptation to pull in different directions.",
      ru: "Вы стоите на противоположных сторонах зодиака, и у каждого есть то, чего нет у другого. Притяжение сильное, но так же сильно желание тянуть в разные стороны.",
    },
    advice: {
      en: "Look for the middle ground: together you see the whole picture.",
      ru: "Ищите золотую середину: вместе вы видите картину целиком.",
    },
  },
};

/** Ключ неупорядоченной пары: стихии или кресты по алфавиту через дефис. */
export function pairKey<T extends string>(a: T, b: T): string {
  return [a, b].sort().join("-");
}

export interface ElementPairProfile {
  text: Bilingual;
  /** Поправки к базовой оценке для любви и дружбы. */
  love: number;
  friendship: number;
}

export const ELEMENT_PAIRS: Record<string, ElementPairProfile> = {
  [pairKey<Element>("fire", "fire")]: {
    love: 5,
    friendship: 5,
    text: {
      en: "Two fire signs: passion, energy and plenty of shared excitement, and quarrels that flare up as quickly as they die down.",
      ru: "Два знака огня: страсть, энергия и общий азарт, а ссоры вспыхивают так же быстро, как и гаснут.",
    },
  },
  [pairKey<Element>("earth", "earth")]: {
    love: 0,
    friendship: 0,
    text: {
      en: "Two earth signs build something solid together: shared plans, a comfortable home, reliability. The risk is getting stuck in routine.",
      ru: "Два знака земли вместе строят что-то основательное: общие планы, уютный дом, надёжность. Риск в том, чтобы увязнуть в рутине.",
    },
  },
  [pairKey<Element>("air", "air")]: {
    love: -5,
    friendship: 8,
    text: {
      en: "Two air signs never run out of things to talk about: ideas, plans, jokes. What may be missing is grounding and emotional depth.",
      ru: "Двум знакам воздуха всегда есть о чём поговорить: идеи, планы, шутки. Может не хватать приземлённости и эмоциональной глубины.",
    },
  },
  [pairKey<Element>("water", "water")]: {
    love: 8,
    friendship: 0,
    text: {
      en: "Two water signs feel each other deeply and intuitively. Tenderness comes easily, but moods can amplify each other.",
      ru: "Два знака воды глубоко и интуитивно чувствуют друг друга. Нежность даётся легко, но настроения могут усиливать друг друга.",
    },
  },
  [pairKey<Element>("fire", "earth")]: {
    love: -5,
    friendship: -3,
    text: {
      en: "Fire brings drive, earth brings structure. Fire may find earth slow and earth may find fire hasty, but together they turn ideas into results.",
      ru: "Огонь приносит напор, земля — структуру. Огню земля может казаться медлительной, земле огонь — поспешным, но вместе они превращают идеи в результат.",
    },
  },
  [pairKey<Element>("fire", "air")]: {
    love: 3,
    friendship: 8,
    text: {
      en: "Air fans the flames: a lively, inspiring pairing full of ideas, humour and adventure.",
      ru: "Воздух раздувает огонь: живое, вдохновляющее сочетание, полное идей, юмора и приключений.",
    },
  },
  [pairKey<Element>("fire", "water")]: {
    love: 5,
    friendship: -8,
    text: {
      en: "Fire and water make steam: strong emotions and strong attraction. Fire needs to soften, water needs to say what it feels.",
      ru: "Огонь и вода дают пар: сильные эмоции и сильное притяжение. Огню стоит смягчаться, воде — говорить о своих чувствах.",
    },
  },
  [pairKey<Element>("earth", "air")]: {
    love: -5,
    friendship: 0,
    text: {
      en: "Earth is practical, air is abstract. Air brings fresh ideas and earth gives them shape; both need patience.",
      ru: "Земля практична, воздух абстрактен. Воздух приносит свежие идеи, земля придаёт им форму; терпение нужно обоим.",
    },
  },
  [pairKey<Element>("earth", "water")]: {
    love: 5,
    friendship: 3,
    text: {
      en: "Water nourishes earth: a caring, steady pairing in which both feel safe and understood.",
      ru: "Вода питает землю: заботливое, устойчивое сочетание, в котором обоим спокойно и понятно.",
    },
  },
  [pairKey<Element>("air", "water")]: {
    love: -3,
    friendship: -3,
    text: {
      en: "Air thinks, water feels. They can teach each other a lot, as long as logic and emotion get equal respect.",
      ru: "Воздух думает, вода чувствует. Они многому научат друг друга, если логику и эмоции уважать одинаково.",
    },
  },
};

export interface ModalityPairProfile {
  text: Bilingual;
  /** Поправка к базовой оценке для совместной работы. */
  work: number;
}

export const MODALITY_PAIRS: Record<string, ModalityPairProfile> = {
  [pairKey<Modality>("cardinal", "cardinal")]: {
    work: -8,
    text: {
      en: "Both of you like to lead and to start things. Divide areas of responsibility so you don't fight over the steering wheel.",
      ru: "Вы оба любите вести и начинать. Разделите зоны ответственности, чтобы не спорить за руль.",
    },
  },
  [pairKey<Modality>("fixed", "fixed")]: {
    work: -3,
    text: {
      en: "Both of you are loyal and persistent, and neither likes to give in. The bond is durable, but disputes can drag on.",
      ru: "Вы оба верны и упорны и не любите уступать. Связь прочная, но споры могут затягиваться.",
    },
  },
  [pairKey<Modality>("mutable", "mutable")]: {
    work: -5,
    text: {
      en: "Both of you are flexible and easy-going. Life together is light, but someone has to make decisions and keep promises.",
      ru: "Вы оба гибкие и лёгкие на подъём. Вместе легко, но кому-то придётся принимать решения и держать обещания.",
    },
  },
  [pairKey<Modality>("cardinal", "fixed")]: {
    work: 8,
    text: {
      en: "One starts, the other sustains. A productive combination, as long as the initiator respects the other's need for stability.",
      ru: "Один начинает, другой удерживает. Продуктивное сочетание, если инициатор уважает потребность другого в стабильности.",
    },
  },
  [pairKey<Modality>("cardinal", "mutable")]: {
    work: 5,
    text: {
      en: "One sets the direction, the other adapts and fills in the details. Good teamwork, as long as flexibility isn't mistaken for having no opinion.",
      ru: "Один задаёт направление, другой подстраивается и наполняет деталями. Хорошая команда, если гибкость не принимают за отсутствие мнения.",
    },
  },
  [pairKey<Modality>("fixed", "mutable")]: {
    work: 3,
    text: {
      en: "One is steady, the other changeable. The fixed sign gives support, the mutable one brings variety; both need to meet halfway.",
      ru: "Один постоянен, другой переменчив. Фиксированный знак даёт опору, мутабельный приносит разнообразие; обоим нужно идти навстречу.",
    },
  },
};
