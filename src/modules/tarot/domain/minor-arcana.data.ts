import type { Suit, TarotCard, TarotCardMeaningTexts, TarotCardMeanings, YesNoLeaning } from "./types";

/**
 * The 56 Minor Arcana. Unlike the Major Arcana (hand-authored card by card),
 * these are *composed* from a suit theme (element/domain) crossed with a rank
 * theme (the numerological "story" 1–10, then the four court archetypes).
 * This mirrors how tarot reference literature itself teaches the Minor
 * Arcana, keeps 56 cards' worth of content maintainable in one place, and
 * still yields fully distinct, structured data per card — nothing here is a
 * placeholder or shared string; every field is generated per suit+rank.
 *
 * Every English template has a Russian twin. The Russian ones interpolate the
 * suit's `domainRuGenitive` (always after "в сфере …" / "сферы …", both of
 * which take the genitive), so no template has to agree in case or gender
 * with a phrase it can't see.
 */

interface SuitTheme {
  title: string;
  /** Genitive plural, as it appears after a rank in a card name — "Three of {title}" → "Тройка {titleRuGenitive}". */
  titleRuGenitive: string;
  domain: string; // e.g. "passion, ambition, and creative drive"
  /** Same content as `domain`, pre-declined into genitive case for insertion after "в сфере" / "сферы". */
  domainRuGenitive: string;
  loveAngle: string;
  careerAngle: string;
  financeAngle: string;
  spiritualAngle: string;
  element: string;
  /** Lowercase nominative plural, used as a keyword ("жезлы"). */
  titleRu: string;
  elementRu: string;
  // Each angle is pre-declined into the case its Russian sentence template needs:
  // love/career → accusative ("опирается на …", "указывает на …"),
  // finance → prepositional ("говорит о …"), spiritual → instrumental ("связана с …").
  loveAngleRu: string;
  careerAngleRu: string;
  financeAngleRu: string;
  spiritualAngleRu: string;
}

const SUIT_THEMES: Record<Suit, SuitTheme> = {
  wands: {
    title: "Wands",
    titleRuGenitive: "Жезлов",
    domain: "passion, ambition, and creative drive",
    domainRuGenitive: "страсти, амбиций и творческого порыва",
    loveAngle: "passion, excitement, and chemistry",
    careerAngle: "initiative, ambition, and creative momentum",
    financeAngle: "bold, energetic moves — worth pairing with a plan",
    spiritualAngle: "the creative will and the spark that starts things",
    element: "fire",
    titleRu: "жезлы",
    elementRu: "огонь",
    loveAngleRu: "страсть, азарт и химию",
    careerAngleRu: "инициативу, амбиции и творческий импульс",
    financeAngleRu: "смелых, энергичных шагах — их стоит сочетать с планом",
    spiritualAngleRu: "творческой волей и искрой, с которой всё начинается",
  },
  cups: {
    title: "Cups",
    titleRuGenitive: "Кубков",
    domain: "emotion, love, and intuition",
    domainRuGenitive: "эмоций, любви и интуиции",
    loveAngle: "feeling, intimacy, and emotional connection",
    careerAngle: "fulfillment, collaboration, and doing work that feels meaningful",
    financeAngle: "spending and giving shaped by feeling as much as by logic",
    spiritualAngle: "the heart's inner life and the flow of feeling",
    element: "water",
    titleRu: "кубки",
    elementRu: "вода",
    loveAngleRu: "чувства, близость и эмоциональную связь",
    careerAngleRu: "удовлетворение от работы, сотрудничество и дело, которое кажется значимым",
    financeAngleRu: "тратах и дарах, на которые чувства влияют не меньше логики",
    spiritualAngleRu: "внутренней жизнью сердца и потоком чувств",
  },
  swords: {
    title: "Swords",
    titleRuGenitive: "Мечей",
    domain: "thought, conflict, and truth",
    domainRuGenitive: "мысли, конфликта и истины",
    loveAngle: "communication, honesty, and where words help or hurt",
    careerAngle: "strategy, decisions, and mental clarity under pressure",
    financeAngle: "contracts, agreements, and clear-headed (not emotional) choices",
    spiritualAngle: "clarity that cuts through illusion, sometimes painfully",
    element: "air",
    titleRu: "мечи",
    elementRu: "воздух",
    loveAngleRu: "общение, честность и то, где слова помогают или ранят",
    careerAngleRu: "стратегию, решения и ясность ума под давлением",
    financeAngleRu: "договорах, соглашениях и трезвых (не эмоциональных) решениях",
    spiritualAngleRu: "ясностью, которая рассекает иллюзии, порой болезненно",
  },
  pentacles: {
    title: "Pentacles",
    titleRuGenitive: "Пентаклей",
    domain: "work, money, and the material world",
    domainRuGenitive: "труда, денег и материального мира",
    loveAngle: "stability, commitment, and dependable care",
    careerAngle: "steady, tangible progress and craftsmanship",
    financeAngle: "money, resources, and long-term security",
    spiritualAngle: "grounding inner values into daily, physical life",
    element: "earth",
    titleRu: "пентакли",
    elementRu: "земля",
    loveAngleRu: "стабильность, обязательства и надёжную заботу",
    careerAngleRu: "устойчивый, ощутимый прогресс и мастерство",
    financeAngleRu: "деньгах, ресурсах и долгосрочной безопасности",
    spiritualAngleRu: "воплощением внутренних ценностей в повседневной, физической жизни",
  },
};

interface RankTemplate {
  title: string;
  /** Nominative — the numeral noun as it stands alone in a card name, e.g. "Тройка" in "Тройка Жезлов". */
  titleRu: string;
  keyword: string;
  keywordRu: string;
  upright: (domain: string) => string;
  reversed: (domain: string) => string;
  /** Takes the suit's genitive domain phrase. */
  uprightRu: (domainGenitive: string) => string;
  reversedRu: (domainGenitive: string) => string;
  yesNo: YesNoLeaning;
}

const NUMBERED_RANKS: RankTemplate[] = [
  {
    title: "Ace",
    titleRu: "Туз",
    keyword: "new beginning",
    keywordRu: "новое начало",
    upright: (d) => `A pure, undiluted spark of ${d} — an opening or offer arriving in its simplest, most potent form.`,
    reversed: (d) => `A false start, a missed opening, or ${d} blocked before it can take root.`,
    uprightRu: (d) => `Чистая, ничем не разбавленная искра ${d} — возможность или предложение, приходящие в самой простой и мощной форме.`,
    reversedRu: (d) => `Ложный старт, упущенная возможность или порыв в сфере ${d}, заблокированный до того, как успел пустить корни.`,
    yesNo: "yes",
  },
  {
    title: "Two",
    titleRu: "Двойка",
    keyword: "choice",
    keywordRu: "выбор",
    upright: (d) => `A choice or partnership taking shape within ${d} — two paths, or two people, weighing options together.`,
    reversed: (d) => `Indecision, imbalance, or a partnership within ${d} that isn't pulling its weight evenly.`,
    uprightRu: (d) => `Выбор или партнёрство, складывающиеся в сфере ${d}: два пути или два человека вместе взвешивают варианты.`,
    reversedRu: (d) => `Нерешительность, дисбаланс или партнёрство в сфере ${d}, где вклад распределён неравномерно.`,
    yesNo: "maybe",
  },
  {
    title: "Three",
    titleRu: "Тройка",
    keyword: "growth",
    keywordRu: "рост",
    upright: (d) => `Early results and forward motion in ${d} — the first visible payoff of effort already made.`,
    reversed: (d) => `Delays, disappointment, or growth in ${d} that has stalled just short of paying off.`,
    uprightRu: (d) => `Первые результаты и движение вперёд в сфере ${d} — первая видимая отдача от уже приложенных усилий.`,
    reversedRu: (d) => `Задержки, разочарование или рост в сфере ${d}, остановившийся в шаге от результата.`,
    yesNo: "yes",
  },
  {
    title: "Four",
    titleRu: "Четвёрка",
    keyword: "stability",
    keywordRu: "стабильность",
    upright: (d) => `A pause to consolidate what's been built in ${d} — stability worth appreciating before pushing further.`,
    reversed: (d) => `Stagnation, or a stability in ${d} that has quietly turned into a rut.`,
    uprightRu: (d) => `Пауза, чтобы закрепить построенное в сфере ${d}, — стабильность, которую стоит оценить, прежде чем двигаться дальше.`,
    reversedRu: (d) => `Застой или стабильность в сфере ${d}, тихо превратившаяся в колею.`,
    yesNo: "maybe",
  },
  {
    title: "Five",
    titleRu: "Пятёрка",
    keyword: "conflict",
    keywordRu: "конфликт",
    upright: (d) => `Friction, competition, or disruption testing ${d} — uncomfortable, but rarely permanent.`,
    reversed: (d) => `Conflict in ${d} beginning to ease, or a lesson from it finally sinking in.`,
    uprightRu: (d) => `Трения, соперничество или сбой, проверяющие на прочность сферу ${d}, — неприятно, но редко навсегда.`,
    reversedRu: (d) => `Конфликт в сфере ${d} начинает стихать, или урок из него наконец усваивается.`,
    yesNo: "no",
  },
  {
    title: "Six",
    titleRu: "Шестёрка",
    keyword: "harmony",
    keywordRu: "гармония",
    upright: (d) => `A return to balance and generosity within ${d} — cooperation working in your favor.`,
    reversed: (d) => `An old imbalance in ${d} resurfacing, or generosity that isn't being returned.`,
    uprightRu: (d) => `Возвращение к равновесию и щедрости в сфере ${d} — сотрудничество работает в вашу пользу.`,
    reversedRu: (d) => `Старый дисбаланс в сфере ${d} снова всплывает, или щедрость остаётся без отклика.`,
    yesNo: "yes",
  },
  {
    title: "Seven",
    titleRu: "Семёрка",
    keyword: "reflection",
    keywordRu: "размышление",
    upright: (d) => `A moment to assess strategy within ${d} — perseverance and honest reflection over quick action.`,
    reversed: (d) => `Second-guessing, or a shortcut within ${d} that's likely to catch up with you.`,
    uprightRu: (d) => `Момент оценить стратегию в сфере ${d} — настойчивость и честное размышление вместо быстрых действий.`,
    reversedRu: (d) => `Сомнения в себе или обходной путь в сфере ${d}, который, скорее всего, ещё напомнит о себе.`,
    yesNo: "maybe",
  },
  {
    title: "Eight",
    titleRu: "Восьмёрка",
    keyword: "momentum",
    keywordRu: "импульс",
    upright: (d) => `Focused skill and fast momentum within ${d} — real progress through practiced effort.`,
    reversed: (d) => `Feeling stuck, scattered, or self-limited within ${d} despite the effort going in.`,
    uprightRu: (d) => `Сфокусированное мастерство и быстрый импульс в сфере ${d} — реальный прогресс благодаря отточенным усилиям.`,
    reversedRu: (d) => `Ощущение застоя, распылённости или самоограничения в сфере ${d}, несмотря на вложенные усилия.`,
    yesNo: "yes-if-cautious",
  },
  {
    title: "Nine",
    titleRu: "Девятка",
    keyword: "resilience",
    keywordRu: "стойкость",
    upright: (d) => `Resilience close to the finish line in ${d} — nearly there, on the strength of what's already been endured.`,
    reversed: (d) => `Exhaustion, worry, or a fear of loss within ${d} that's bigger than the situation itself.`,
    uprightRu: (d) => `Стойкость у финишной черты в сфере ${d} — почти у цели, благодаря всему, что уже пережито.`,
    reversedRu: (d) => `Истощение, тревога или страх потери в сфере ${d}, превосходящие саму ситуацию.`,
    yesNo: "maybe",
  },
  {
    title: "Ten",
    titleRu: "Десятка",
    keyword: "completion",
    keywordRu: "завершение",
    upright: (d) => `A cycle of ${d} reaching its natural completion — full, whether that fullness feels like triumph or like a weight to finally set down.`,
    reversed: (d) => `A slow, drawn-out ending within ${d}, or the pressure of a cycle refusing to close.`,
    uprightRu: (d) => `Цикл в сфере ${d} подходит к естественному завершению — полному, будь то торжество или груз, который наконец можно снять.`,
    reversedRu: (d) => `Медленное, затянувшееся завершение в сфере ${d} или давление цикла, отказывающегося закрыться.`,
    yesNo: "maybe",
  },
];

interface CourtTemplate {
  title: string;
  titleRu: string;
  keyword: string;
  keywordRu: string;
  archetype: string;
  /** `archetype`, pre-declined into genitive case for insertion after "архетип". */
  archetypeRuGenitive: string;
  upright: (domain: string) => string;
  reversed: (domain: string) => string;
  uprightRu: (domainGenitive: string) => string;
  reversedRu: (domainGenitive: string) => string;
  yesNo: YesNoLeaning;
}

const COURT_RANKS: CourtTemplate[] = [
  {
    title: "Page",
    titleRu: "Паж",
    keyword: "messenger",
    keywordRu: "вестник",
    archetype: "a curious student",
    archetypeRuGenitive: "любознательного ученика",
    upright: (d) => `A curious student of ${d} — news, a lesson, or an invitation to explore this domain with fresh eyes.`,
    reversed: (d) => `Immaturity, a missed message, or ${d} approached carelessly.`,
    uprightRu: (d) => `Любознательный ученик сферы ${d} — новость, урок или приглашение исследовать эту область свежим взглядом.`,
    reversedRu: (d) => `Незрелость, упущенное сообщение или небрежный подход к сфере ${d}.`,
    yesNo: "maybe",
  },
  {
    title: "Knight",
    titleRu: "Рыцарь",
    keyword: "pursuit",
    keywordRu: "стремление",
    archetype: "an energetic pursuer",
    archetypeRuGenitive: "энергичного искателя",
    upright: (d) => `Energetic, single-minded pursuit of ${d} — movement and action, for better or worse.`,
    reversed: (d) => `Recklessness, or pursuit of ${d} that has become impulsive or scattered.`,
    uprightRu: (d) => `Энергичное, целеустремлённое движение в сфере ${d} — действие и напор, к добру или к худу.`,
    reversedRu: (d) => `Безрассудство или погоня в сфере ${d}, ставшая импульсивной или хаотичной.`,
    yesNo: "yes-if-cautious",
  },
  {
    title: "Queen",
    titleRu: "Королева",
    keyword: "intuitive mastery",
    keywordRu: "интуитивное мастерство",
    archetype: "an intuitive master",
    archetypeRuGenitive: "интуитивного мастера",
    upright: (d) => `Intuitive, internalized mastery of ${d} — nurturing this domain from lived understanding rather than theory.`,
    reversed: (d) => `Insecurity, or mastery of ${d} turned inward and self-critical instead of generous.`,
    uprightRu: (d) => `Интуитивное, глубоко усвоенное мастерство в сфере ${d} — забота об этой области из прожитого понимания, а не из теории.`,
    reversedRu: (d) => `Неуверенность или мастерство в сфере ${d}, обращённое внутрь и самокритичное вместо щедрого.`,
    yesNo: "yes",
  },
  {
    title: "King",
    titleRu: "Король",
    keyword: "command",
    keywordRu: "власть",
    archetype: "a commanding authority",
    archetypeRuGenitive: "властного правителя",
    upright: (d) => `Confident, externalized command of ${d} — leading from experience and earned authority.`,
    reversed: (d) => `Control issues, or authority over ${d} used rigidly rather than wisely.`,
    uprightRu: (d) => `Уверенное, внешне выраженное владение сферой ${d} — лидерство на основе опыта и заслуженного авторитета.`,
    reversedRu: (d) => `Проблемы с контролем или власть в сфере ${d}, применяемая жёстко, а не мудро.`,
    yesNo: "yes",
  },
];

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function buildMeanings(
  domain: string,
  angles: SuitTheme,
  upright: string,
  reversed: string,
  yesNo: YesNoLeaning,
): TarotCardMeanings {
  return {
    upright,
    reversed,
    love: `In matters of the heart, this card leans on ${angles.loveAngle} — symbolically, ${domain} playing out between two people.`,
    career: `At work, this points to ${angles.careerAngle}.`,
    finance: `Financially, this suggests ${angles.financeAngle}.`,
    spiritual: `Spiritually, one possible interpretation centers on ${angles.spiritualAngle}.`,
    yesNo,
  };
}

function buildMeaningsRu(theme: SuitTheme, upright: string, reversed: string): TarotCardMeaningTexts {
  return {
    upright,
    reversed,
    love: `В делах сердца эта карта опирается на ${theme.loveAngleRu} — символически, сфера ${theme.domainRuGenitive} разворачивается между двумя людьми.`,
    career: `На работе это указывает на ${theme.careerAngleRu}.`,
    finance: `В финансах это говорит о ${theme.financeAngleRu}.`,
    spiritual: `В духовном плане одна из возможных трактовок связана с ${theme.spiritualAngleRu}.`,
  };
}

function buildMinorArcana(): TarotCard[] {
  const cards: TarotCard[] = [];
  const suits = Object.keys(SUIT_THEMES) as Suit[];

  for (const suit of suits) {
    const theme = SUIT_THEMES[suit];

    NUMBERED_RANKS.forEach((rank, index) => {
      const number = index + 1;
      const name = `${rank.title} of ${theme.title}`;
      const nameRu = `${rank.titleRu} ${theme.titleRuGenitive}`;
      cards.push({
        id: slugify(name),
        name,
        nameRu,
        arcana: "minor",
        suit,
        number,
        image: null,
        keywords: [rank.keyword, theme.element, theme.title.toLowerCase()],
        keywordsRu: [rank.keywordRu, theme.elementRu, theme.titleRu],
        description: `The ${rank.title.toLowerCase()} of the ${theme.title.toLowerCase()} suit, carrying ${theme.domain} through the lens of ${rank.keyword}.`,
        descriptionRu: `Карта «${nameRu}» отражает ${theme.domainRuGenitive} через призму темы «${rank.keywordRu}».`,
        meanings: buildMeanings(theme.domain, theme, rank.upright(theme.domain), rank.reversed(theme.domain), rank.yesNo),
        meaningsRu: buildMeaningsRu(theme, rank.uprightRu(theme.domainRuGenitive), rank.reversedRu(theme.domainRuGenitive)),
      });
    });

    COURT_RANKS.forEach((court, courtIndex) => {
      const number = 11 + courtIndex;
      const name = `${court.title} of ${theme.title}`;
      const nameRu = `${court.titleRu} ${theme.titleRuGenitive}`;
      cards.push({
        id: slugify(name),
        name,
        nameRu,
        arcana: "minor",
        suit,
        number,
        image: null,
        keywords: [court.keyword, theme.element, theme.title.toLowerCase()],
        keywordsRu: [court.keywordRu, theme.elementRu, theme.titleRu],
        description: `${court.archetype[0].toUpperCase()}${court.archetype.slice(1)} within the ${theme.title.toLowerCase()} suit, embodying ${theme.domain}.`,
        descriptionRu: `Карта «${nameRu}» воплощает архетип ${court.archetypeRuGenitive} в стихии ${theme.domainRuGenitive}.`,
        meanings: buildMeanings(theme.domain, theme, court.upright(theme.domain), court.reversed(theme.domain), court.yesNo),
        meaningsRu: buildMeaningsRu(theme, court.uprightRu(theme.domainRuGenitive), court.reversedRu(theme.domainRuGenitive)),
      });
    });
  }

  return cards;
}

export const MINOR_ARCANA: TarotCard[] = buildMinorArcana();
