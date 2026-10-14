import type { Suit, TarotCard, TarotCardMeaningTexts, TarotCardMeanings, YesNoLeaning } from "./types";

/**
 * 56 младших арканов. В отличие от старших (написанных вручную карта за картой), они *составляются*
 * из темы масти (стихия и область), скрещённой с темой достоинства (нумерологическая «история» 1–10,
 * затем четыре придворных архетипа). Так устроена и сама справочная литература по таро, так 56 карт
 * поддерживаются в одном месте, и при этом данные каждой карты остаются полностью различными
 * и структурированными: здесь нет ни заглушек, ни общих строк, каждое поле порождается для сочетания
 * масти и достоинства.
 *
 * У каждого английского шаблона есть русская пара. Русские шаблоны подставляют `domainRuGenitive`
 * масти (всегда после «в сфере …» / «сферы …», оба требуют родительного падежа), поэтому ни одному
 * шаблону не нужно согласовываться по падежу и роду с фразой, которую он не видит.
 */

interface SuitTheme {
  title: string;
  /**
   * Родительный падеж множественного числа, как после достоинства в названии карты:
   * «Three of {title}» → «Тройка {titleRuGenitive}».
   */
  titleRuGenitive: string;
  domain: string; // например: «passion, ambition, and creative drive»
  /**
   * То же содержимое, что `domain`, заранее склонённое в родительный падеж для вставки после
   * «в сфере» / «сферы».
   */
  domainRuGenitive: string;
  loveAngle: string;
  careerAngle: string;
  financeAngle: string;
  spiritualAngle: string;
  element: string;
  /** Нижний регистр, именительный падеж множественного числа; используется как ключевое слово («жезлы»). */
  titleRu: string;
  elementRu: string;
  // Каждый ракурс заранее склонён в тот падеж, который нужен русскому шаблону предложения:
  // любовь и карьера — винительный («опирается на …», «указывает на …»), финансы — предложный
  // («говорит о …»), духовное — творительный («связана с …»).
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
  /**
   * Именительный падеж: числительное как существительное само по себе в названии карты,
   * например «Тройка» в «Тройка Жезлов».
   */
  titleRu: string;
  keyword: string;
  keywordRu: string;
  upright: (domain: string) => string;
  reversed: (domain: string) => string;
  /** Принимает фразу области масти в родительном падеже. */
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
  /** `archetype`, заранее склонённый в родительный падеж для вставки после «архетип». */
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

/** Четыре тематических абзаца достоинства: самостоятельные предложения, не зависящие от масти. */
interface RankTopics {
  love: string;
  career: string;
  finance: string;
  spiritual: string;
}

/**
 * Значения достоинства по четырём темам. Ключ — английское название достоинства из шаблонов выше.
 * Предложение достоинства дописывается после предложения масти, поэтому текст по каждой теме
 * уникален для каждой из 56 карт и при этом не требует согласования с падежом масти.
 */
const RANK_TOPICS: Record<string, { en: RankTopics; ru: RankTopics }> = {
  Ace: {
    en: {
      love: "A new chapter is opening: a first spark, a fresh start, or a renewed willingness to let someone closer.",
      career: "A new opportunity, project, or offer is arriving — the seed is small, so it is worth acting on early.",
      finance: "A fresh financial beginning: a new source, a first step toward a goal, or an offer worth a careful look.",
      spiritual: "A clean slate for inner work — a moment of fresh intention, where one small honest step matters more than a grand plan.",
    },
    ru: {
      love: "Открывается новая глава: первая искра, новый старт или готовность впустить кого-то ближе.",
      career: "Появляется новая возможность, проект или предложение — это пока зерно, поэтому действовать стоит рано.",
      finance: "Новое финансовое начало: новый источник, первый шаг к цели или предложение, которое стоит внимательно изучить.",
      spiritual: "Чистый лист для внутренней работы — время новых намерений, когда один небольшой честный шаг важнее грандиозного плана.",
    },
  },
  Two: {
    en: {
      love: "A bond at a crossroads: two people weighing how close to come, or one person choosing between two pulls.",
      career: "A choice or partnership to weigh: two options, or two people who need to agree on a shared direction.",
      finance: "A balancing act: two priorities competing for the same resources, and a decision best made calmly.",
      spiritual: "A call to hold two sides in balance — doubt and trust, giving and receiving — without rushing to resolve them.",
    },
    ru: {
      love: "Связь на перекрёстке: двое решают, насколько сблизиться, или один человек выбирает между двумя влечениями.",
      career: "Выбор или партнёрство, которые стоит взвесить: два варианта или два человека, которым нужно согласовать общее направление.",
      finance: "Баланс между двумя задачами, которые претендуют на одни и те же ресурсы; решение лучше принимать спокойно.",
      spiritual: "Призыв удерживать две стороны в равновесии — сомнение и доверие, отдавание и принятие — не спеша с выводами.",
    },
  },
  Three: {
    en: {
      love: "Warmth that is growing: shared joy, a relationship finding its footing, or friends and family widening the circle.",
      career: "Early results are showing — teamwork and visible progress make this a good moment to share the effort and the credit.",
      finance: "First returns on earlier effort: modest but real growth, best supported by steady follow-through.",
      spiritual: "Growth through connection — what you have planted begins to show, and company helps it along.",
    },
    ru: {
      love: "Тепло растёт: общая радость, отношения обретают опору, а друзья или семья расширяют круг.",
      career: "Первые результаты уже видны — командная работа и заметный прогресс; хороший момент разделить усилия и заслуги.",
      finance: "Первая отдача от прежних усилий: скромный, но реальный рост, который лучше поддержать последовательностью.",
      spiritual: "Рост через связь с другими: посеянное начинает проявляться, и общение помогает ему расти.",
    },
  },
  Four: {
    en: {
      love: "A stable, comfortable stretch: security and routine can be a gift, or a quiet signal that closeness needs fresh attention.",
      career: "Consolidation: secure what you have built, rest briefly, and ask whether the current setup still fits you.",
      finance: "A period of savings and security — a solid base, though holding too tightly can stall growth.",
      spiritual: "A pause for stillness: inner stability is available now, and so is the question of what it is time to outgrow.",
    },
    ru: {
      love: "Спокойный, устойчивый период: безопасность и привычный уклад могут быть даром — или тихим сигналом, что близости нужно свежее внимание.",
      career: "Закрепление достигнутого: сохраните построенное, коротко передохните и спросите себя, подходит ли вам нынешний уклад.",
      finance: "Время накоплений и надёжности — прочная основа, хотя слишком крепкая хватка может затормозить рост.",
      spiritual: "Пауза для тишины: внутренняя устойчивость сейчас доступна — как и вопрос о том, из чего пора вырасти.",
    },
  },
  Five: {
    en: {
      love: "Tension or hurt between people: arguments, rivalry, or a sense of loss — a prompt to repair rather than to win.",
      career: "Competition and disagreement at work — friction that can sharpen you if you stay constructive and pick your battles.",
      finance: "A stressful stretch: losses, disputes, or pressure on resources — best met with a clear count of what remains.",
      spiritual: "A lesson in discomfort: conflict and loss point to what you are attached to, and where growth is asking to begin.",
    },
    ru: {
      love: "Напряжение или обида между людьми: споры, соперничество или чувство утраты — повод восстанавливать, а не побеждать.",
      career: "Соперничество и разногласия на работе — трения, которые могут закалить, если оставаться конструктивным и выбирать, за что бороться.",
      finance: "Непростой период: потери, споры или давление на ресурсы — лучше встретить его, ясно посчитав, что осталось.",
      spiritual: "Урок дискомфорта: конфликт и потеря показывают, к чему вы привязаны и где просит начаться рост.",
    },
  },
  Six: {
    en: {
      love: "Kindness and reconciliation: generosity, nostalgia, or an old connection returning on gentler terms.",
      career: "Fair exchange and support: help given or received, recognition shared, and cooperation that lifts everyone.",
      finance: "Resources moving in a healthy balance — giving, receiving, or settling what is owed in a fair way.",
      spiritual: "Ease in giving and receiving: balance returns through generosity, forgiveness, and gratitude.",
    },
    ru: {
      love: "Доброта и примирение: щедрость, ностальгия или старая связь, возвращающаяся на более мягких условиях.",
      career: "Честный обмен и поддержка: помощь, данная или полученная, общее признание и сотрудничество, которое поднимает всех.",
      finance: "Ресурсы движутся в здоровом балансе: вы даёте, получаете или справедливо закрываете долги.",
      spiritual: "Лёгкость в том, чтобы давать и принимать: равновесие возвращается через щедрость, прощение и благодарность.",
    },
  },
  Seven: {
    en: {
      love: "A time to look honestly at what you want: doubts, mixed signals, or an urge to test the ground before committing.",
      career: "Evaluate before acting: weigh strategy, protect your position, and avoid scattering effort across too many options.",
      finance: "A moment to review the plan: the patient investment tends to outperform the tempting shortcut.",
      spiritual: "A contemplative pause: sort real aims from illusions, and trust patience over haste.",
    },
    ru: {
      love: "Время честно взглянуть на то, чего вы хотите: сомнения, неясные сигналы или желание проверить почву, прежде чем решиться.",
      career: "Оценивайте, прежде чем действовать: взвесьте стратегию, защитите свою позицию и не распыляйте силы на слишком много вариантов.",
      finance: "Момент пересмотреть план: терпеливое вложение обычно выигрывает у соблазнительного обходного пути.",
      spiritual: "Созерцательная пауза: отделите настоящие цели от иллюзий и доверьтесь терпению, а не спешке.",
    },
  },
  Eight: {
    en: {
      love: "Movement and focus: attention is being poured into the relationship, or into leaving behind what no longer feeds it.",
      career: "Skill and speed: a productive stretch of focused effort, where practice and discipline show results.",
      finance: "Steady, disciplined effort pays: building through skill and repetition rather than a single leap.",
      spiritual: "Devoted practice: progress through steady repetition — or the courage to walk away from what has been outgrown.",
    },
    ru: {
      love: "Движение и сосредоточенность: внимание вкладывается в отношения — или в то, чтобы отпустить то, что их больше не питает.",
      career: "Мастерство и скорость: продуктивный период сосредоточенной работы, в котором практика и дисциплина дают результат.",
      finance: "Размеренные, дисциплинированные усилия окупаются: строить через умение и повторение, а не одним прыжком.",
      spiritual: "Преданная практика: прогресс через ровное повторение — или смелость уйти от того, из чего вы выросли.",
    },
  },
  Nine: {
    en: {
      love: "Strength drawn from experience: a guarded heart, hard-won independence, or a bond that has weathered a lot.",
      career: "You are close to the goal: persistence matters now, along with protecting your energy for the last stretch.",
      finance: "Near-security: resilience and prudence have built a cushion, and the final steps ask for patience.",
      spiritual: "Inner resilience: what you have endured has made you wiser, and the finish line asks for one more act of trust.",
    },
    ru: {
      love: "Сила, выросшая из опыта: настороженное сердце, с трудом завоёванная независимость или связь, пережившая многое.",
      career: "Цель близка: сейчас важна настойчивость и умение беречь силы для последнего рывка.",
      finance: "Почти надёжность: стойкость и благоразумие создали подушку, а последние шаги требуют терпения.",
      spiritual: "Внутренняя стойкость: пережитое сделало вас мудрее, а у самого финиша стоит довериться ещё раз.",
    },
  },
  Ten: {
    en: {
      love: "A cycle in the relationship reaches fullness: lasting commitment and shared life, or a burden it is time to set down.",
      career: "A project or chapter reaches its end point: results arrive in full, along with the chance to delegate or let go.",
      finance: "A financial cycle completes: either the weight of everything carried, or the reward of long effort.",
      spiritual: "Completion and release: an old story ends, making space for what comes next.",
    },
    ru: {
      love: "Цикл в отношениях достигает полноты: прочные обязательства и общая жизнь — или ноша, которую пора опустить.",
      career: "Проект или глава подходит к концу: результат приходит в полном объёме, вместе с возможностью делегировать или отпустить.",
      finance: "Финансовый цикл завершается: тяжесть всего, что приходилось нести, — или награда за долгие усилия.",
      spiritual: "Завершение и освобождение: старая история заканчивается, оставляя место для следующей.",
    },
  },
  Page: {
    en: {
      love: "A tender, curious beginning: a message, a shy gesture, or a chance to learn what someone really feels.",
      career: "A student's stance: news, a new skill to learn, or a small task that opens a door.",
      finance: "A small first step: learn the basics, ask questions, and begin modestly before committing more.",
      spiritual: "Beginner's mind: openness to a lesson or a sign, and curiosity as a form of practice.",
    },
    ru: {
      love: "Нежное, любопытное начало: сообщение, робкий жест или шанс узнать, что на самом деле чувствует другой человек.",
      career: "Позиция ученика: новость, новый навык или небольшая задача, которая открывает дверь.",
      finance: "Небольшой первый шаг: изучить основы, задавать вопросы и начать скромно, прежде чем вкладываться больше.",
      spiritual: "Ум новичка: открытость уроку или знаку, а любопытство как форма практики.",
    },
  },
  Knight: {
    en: {
      love: "Ardour and movement: a passionate pursuit or a swift change, which asks for follow-through as much as enthusiasm.",
      career: "Drive and action: a push forward on a goal, where speed helps but a plan keeps it from burning out.",
      finance: "A bold move or quick change: momentum is available, so pair it with careful checks.",
      spiritual: "A quest in motion: devotion to a path, tempered by patience so the journey does not outrun its meaning.",
    },
    ru: {
      love: "Пыл и движение: страстное преследование или быстрые перемены, которым нужна не только горячность, но и постоянство.",
      career: "Напор и действие: рывок к цели, где скорость помогает, а план не даёт выгореть.",
      finance: "Смелый шаг или быстрая перемена: импульс есть, поэтому подкрепите его тщательными проверками.",
      spiritual: "Поиск в движении: преданность пути, смягчённая терпением, чтобы путешествие не опережало свой смысл.",
    },
  },
  Queen: {
    en: {
      love: "Emotionally mature care: warmth, steady attention, and the confidence to be both open and self-possessed.",
      career: "Skilled, nurturing leadership: competence expressed through care, intuition, and a trusted presence.",
      finance: "Wise stewardship: managing resources with intuition and practicality, providing without overspending.",
      spiritual: "Inner authority: trusting intuition, tending your own well-being, and drawing from experience rather than theory.",
    },
    ru: {
      love: "Эмоционально зрелая забота: тепло, устойчивое внимание и уверенность быть одновременно открытым и собранным.",
      career: "Умелое, заботливое лидерство: компетентность, выраженная через чуткость, интуицию и надёжное присутствие.",
      finance: "Мудрое управление: распоряжаться ресурсами с интуицией и практичностью, обеспечивая нужное без лишних трат.",
      spiritual: "Внутренний авторитет: доверие интуиции, забота о собственном благополучии и опора на опыт, а не на теорию.",
    },
  },
  King: {
    en: {
      love: "Steady, reliable commitment: a partner who leads with maturity, protection, and clear boundaries.",
      career: "Authority and mastery: decisive leadership, clear vision, and accountability for the outcome.",
      finance: "Command of resources: sound, experienced judgment and a long view of security.",
      spiritual: "Mastery of self: discipline, integrity, and the calm that comes from living by your own values.",
    },
    ru: {
      love: "Устойчивая, надёжная преданность: партнёр, который ведёт зрело, защищает и чётко обозначает границы.",
      career: "Авторитет и мастерство: решительное лидерство, чёткое видение и ответственность за результат.",
      finance: "Владение ресурсами: трезвое, опытное суждение и взгляд на безопасность в долгосрочной перспективе.",
      spiritual: "Владение собой: дисциплина, цельность и спокойствие, которое приходит от жизни по собственным ценностям.",
    },
  },
};

function requireRankTopics(rankTitle: string): { en: RankTopics; ru: RankTopics } {
  const topics = RANK_TOPICS[rankTitle];
  if (!topics) throw new Error(`Нет тематических значений для достоинства «${rankTitle}»`);
  return topics;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function buildMeanings(angles: SuitTheme, topics: RankTopics, upright: string, reversed: string, yesNo: YesNoLeaning): TarotCardMeanings {
  return {
    upright,
    reversed,
    love: `In matters of the heart, this card leans on ${angles.loveAngle}. ${topics.love}`,
    career: `At work, this points to ${angles.careerAngle}. ${topics.career}`,
    finance: `Financially, this suggests ${angles.financeAngle}. ${topics.finance}`,
    spiritual: `Spiritually, one possible interpretation centers on ${angles.spiritualAngle}. ${topics.spiritual}`,
    yesNo,
  };
}

function buildMeaningsRu(theme: SuitTheme, topics: RankTopics, upright: string, reversed: string): TarotCardMeaningTexts {
  return {
    upright,
    reversed,
    love: `В делах сердца эта карта опирается на ${theme.loveAngleRu}. ${topics.love}`,
    career: `На работе это указывает на ${theme.careerAngleRu}. ${topics.career}`,
    finance: `В финансах это говорит о ${theme.financeAngleRu}. ${topics.finance}`,
    spiritual: `В духовном плане одна из возможных трактовок связана с ${theme.spiritualAngleRu}. ${topics.spiritual}`,
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
      const topics = requireRankTopics(rank.title);
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
        descriptionRu: `Карта «${nameRu}» раскрывает тему «${rank.keywordRu}» в сфере ${theme.domainRuGenitive}.`,
        meanings: buildMeanings(theme, topics.en, rank.upright(theme.domain), rank.reversed(theme.domain), rank.yesNo),
        meaningsRu: buildMeaningsRu(theme, topics.ru, rank.uprightRu(theme.domainRuGenitive), rank.reversedRu(theme.domainRuGenitive)),
      });
    });

    COURT_RANKS.forEach((court, courtIndex) => {
      const number = 11 + courtIndex;
      const name = `${court.title} of ${theme.title}`;
      const nameRu = `${court.titleRu} ${theme.titleRuGenitive}`;
      const topics = requireRankTopics(court.title);
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
        descriptionRu: `Карта «${nameRu}» воплощает архетип ${court.archetypeRuGenitive} в сфере ${theme.domainRuGenitive}.`,
        meanings: buildMeanings(theme, topics.en, court.upright(theme.domain), court.reversed(theme.domain), court.yesNo),
        meaningsRu: buildMeaningsRu(theme, topics.ru, court.uprightRu(theme.domainRuGenitive), court.reversedRu(theme.domainRuGenitive)),
      });
    });
  }

  return cards;
}

export const MINOR_ARCANA: TarotCard[] = buildMinorArcana();
