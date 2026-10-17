import type { Element, ZodiacSignId } from "./types";

/**
 * Тексты гороскопа на день (см. services/daily-horoscope.ts). Гороскоп собирается по классической
 * схеме солнечного знака: настроение дня задаёт знак, в котором стоит Луна, а тема дня для читателя —
 * дом, в который Луна попадает, если считать дома от его знака (Луна в том же знаке — 1-й дом, в
 * следующем — 2-й и так далее). Сами положения Луны и Меркурия считаются по эфемеридам на полдень по
 * Москве, поэтому тексты меняются вслед за настоящим небом, а не случайно.
 */

export interface Bilingual {
  en: string;
  ru: string;
}

export type MoonPhase =
  | "new"
  | "waxing_crescent"
  | "first_quarter"
  | "waxing_gibbous"
  | "full"
  | "waning_gibbous"
  | "last_quarter"
  | "waning_crescent";

/** «Погода» дня по знаку Луны: одинакова для всех читателей. */
export const MOON_SIGN_MOOD: Record<ZodiacSignId, Bilingual> = {
  aries: {
    en: "The Moon in Aries speeds everything up: feelings flare quickly and cool just as fast. A good day to start things, a poor one for waiting.",
    ru: "Луна в Овне ускоряет всё вокруг: чувства вспыхивают быстро и так же быстро остывают. День хорош для начала, но не для ожидания.",
  },
  taurus: {
    en: "The Moon in Taurus slows the pace and asks for comfort. Simple pleasures, steady work and a good meal keep the mood even.",
    ru: "Луна в Тельце замедляет темп и просит комфорта. Простые радости, спокойная работа и вкусная еда выравнивают настроение.",
  },
  gemini: {
    en: "The Moon in Gemini fills the day with messages, ideas and small talk. Attention scatters easily, but curiosity runs high.",
    ru: "Луна в Близнецах наполняет день сообщениями, идеями и разговорами. Внимание легко рассеивается, зато любопытство на высоте.",
  },
  cancer: {
    en: "The Moon in Cancer turns attention homeward. Feelings run deeper than usual, and caring for loved ones comes naturally.",
    ru: "Луна в Раке поворачивает внимание к дому. Чувства глубже обычного, а забота о близких даётся легко.",
  },
  leo: {
    en: "The Moon in Leo wants warmth, attention and a little drama. Generosity and creativity are within easy reach today.",
    ru: "Луна во Льве хочет тепла, внимания и немного театра. Щедрость и творческий настрой сегодня под рукой.",
  },
  virgo: {
    en: "The Moon in Virgo notices details. A good day for putting things in order, but beware of nitpicking, including at yourself.",
    ru: "Луна в Деве замечает детали. День подходит, чтобы навести порядок, но не придирайтесь к мелочам, в том числе к себе.",
  },
  libra: {
    en: "The Moon in Libra looks for balance and pleasant company. Agreements come easier today, decisions a little harder.",
    ru: "Луна в Весах ищет равновесия и приятной компании. Договариваться сегодня легче, принимать решения чуть труднее.",
  },
  scorpio: {
    en: "The Moon in Scorpio intensifies emotions and makes small things feel significant. Being honest with yourself pays off today.",
    ru: "Луна в Скорпионе усиливает эмоции, и мелочи кажутся значительными. Честность с собой сегодня окупается.",
  },
  sagittarius: {
    en: "The Moon in Sagittarius lifts the mood and pulls toward the horizon: travel, study, big plans. Optimism is contagious.",
    ru: "Луна в Стрельце поднимает настроение и тянет к горизонту: поездки, учёба, большие планы. Оптимизм заразителен.",
  },
  capricorn: {
    en: "The Moon in Capricorn is serious and practical. Emotions give way to duties, and concrete results bring the most satisfaction.",
    ru: "Луна в Козероге серьёзна и практична. Эмоции уступают место делам, а больше всего радует ощутимый результат.",
  },
  aquarius: {
    en: "The Moon in Aquarius brings a cool head and unusual ideas. Friends, communities and plans for the future come to the fore.",
    ru: "Луна в Водолее приносит холодную голову и необычные идеи. На первый план выходят друзья, сообщества и планы на будущее.",
  },
  pisces: {
    en: "The Moon in Pisces softens the edges and sharpens intuition. Dreams, music and quiet help more than pushing hard.",
    ru: "Луна в Рыбах смягчает углы и обостряет интуицию. Мечты, музыка и тишина помогают больше, чем напор.",
  },
};

/**
 * Тема дня по дому Луны, считая от знака читателя (индекс 0 — 1-й дом). По два варианта на дом:
 * Луна проходит дом за два-три дня, и соседние дни не повторяют друг друга дословно.
 */
export const SOLAR_HOUSE_THEMES: readonly (readonly [Bilingual, Bilingual])[] = [
  [
    {
      en: "The Moon is in your sign: you are more visible than usual, and your mood sets the tone for those around you. Today you can put yourself first without guilt.",
      ru: "Луна в вашем знаке: вы заметнее обычного, и ваше настроение задаёт тон окружающим. Сегодня можно без чувства вины поставить себя на первое место.",
    },
    {
      en: "A personal day: your energy follows your own wishes rather than other people's plans. A good moment to refresh your look or start something just for yourself.",
      ru: "Личный день: силы идут туда, куда хотите вы, а не туда, куда зовут чужие планы. Хороший момент обновить образ или начать что-то только для себя.",
    },
  ],
  [
    {
      en: "Attention shifts to money and the things you value. Review your spending and notice what really gives you a sense of security.",
      ru: "Внимание смещается к деньгам и ценным для вас вещам. Пересмотрите траты и подумайте, что на самом деле даёт вам чувство опоры.",
    },
    {
      en: "A practical day for your finances: small improvements now add up later. Avoid buying things just to lift your mood.",
      ru: "Практичный день для финансов: небольшие улучшения сейчас потом сложатся в заметный результат. Избегайте покупок только ради настроения.",
    },
  ],
  [
    {
      en: "Conversations, messages and short trips fill the day. Say what you mean plainly: you will be heard better than usual.",
      ru: "День наполнен разговорами, сообщениями и короткими поездками. Говорите прямо: сегодня вас услышат лучше обычного.",
    },
    {
      en: "Your mind is quick and curious. Read, write, ask questions; a chat with a sibling or a neighbour may bring useful news.",
      ru: "Ум быстрый и любопытный. Читайте, пишите, задавайте вопросы: разговор с братом, сестрой или соседом может принести полезные новости.",
    },
  ],
  [
    {
      en: "Home and family come to the fore. Time spent arranging your space or with relatives restores your strength.",
      ru: "На первый план выходят дом и семья. Время, проведённое за обустройством своего пространства или с родными, восстанавливает силы.",
    },
    {
      en: "A day to slow down and feel your roots. Old memories may surface; treat them gently, they hold useful clues.",
      ru: "День, чтобы замедлиться и почувствовать свои корни. Могут всплыть старые воспоминания: отнеситесь к ним бережно, в них есть подсказки.",
    },
  ],
  [
    {
      en: "Creativity and romance are in the spotlight. Let yourself play, flirt and create: joy is not a waste of time today.",
      ru: "В центре внимания творчество и романтика. Позвольте себе играть, флиртовать, создавать: радость сегодня не пустая трата времени.",
    },
    {
      en: "A bright, expressive day. Hobbies, children and dates go well; show what you love doing without waiting for permission.",
      ru: "Яркий и выразительный день. Хобби, дети и свидания складываются удачно: покажите, что вы любите делать, не дожидаясь разрешения.",
    },
  ],
  [
    {
      en: "Everyday tasks and health ask for attention. Tidy up your schedule, close small tasks and take care of your body.",
      ru: "Повседневные дела и здоровье просят внимания. Наведите порядок в расписании, закройте мелкие задачи и позаботьтесь о теле.",
    },
    {
      en: "A working day in the best sense: steady effort brings visible progress. Good for habits, to-do lists and helping colleagues.",
      ru: "Рабочий день в лучшем смысле: ровные усилия дают видимый результат. Хорошо подходит для привычек, списков дел и помощи коллегам.",
    },
  ],
  [
    {
      en: "Relationships take centre stage. Partners and close people need your attention, and compromise comes easier than argument today.",
      ru: "Отношения выходят на первый план. Партнёрам и близким нужно ваше внимание, а компромисс сегодня даётся легче, чем спор.",
    },
    {
      en: "Today other people act as your mirror. Listen to what a partner or colleague is really saying: it may be about you.",
      ru: "Сегодня окружающие становятся вашим зеркалом. Прислушайтесь к тому, что на самом деле говорит партнёр или коллега: возможно, это о вас.",
    },
  ],
  [
    {
      en: "A deep, intense day. Shared money, trust and hidden feelings come up; looking at them honestly is better than avoiding them.",
      ru: "Глубокий и насыщенный день. Поднимаются темы общих денег, доверия и скрытых чувств: честно взглянуть на них лучше, чем избегать.",
    },
    {
      en: "Something is asking to be let go. A good day to end what has run its course and to talk about things that usually stay unsaid.",
      ru: "Что-то просит, чтобы его отпустили. Хороший день, чтобы завершить отжившее и поговорить о том, о чём обычно молчат.",
    },
  ],
  [
    {
      en: "Your horizon widens. Travel plans, study and big questions about meaning draw you in; follow your curiosity.",
      ru: "Горизонт расширяется. Вас привлекают планы поездок, учёба и большие вопросы о смысле: следуйте за любопытством.",
    },
    {
      en: "A day for seeing the bigger picture. A talk with a mentor or a good book may change how you see a familiar problem.",
      ru: "День, чтобы увидеть картину целиком. Разговор с наставником или хорошая книга могут изменить взгляд на привычную задачу.",
    },
  ],
  [
    {
      en: "Career and reputation are in focus. Your efforts are more noticeable than usual, so show your results and take responsibility.",
      ru: "В фокусе карьера и репутация. Ваши усилия сегодня заметнее обычного, поэтому показывайте результаты и берите ответственность.",
    },
    {
      en: "A day for ambition. Think about where you want to be in a year and take one concrete step in that direction.",
      ru: "День для амбиций. Подумайте, где хотите оказаться через год, и сделайте один конкретный шаг в эту сторону.",
    },
  ],
  [
    {
      en: "Friends and like-minded people bring support and ideas. Join in, answer old messages, share your plans.",
      ru: "Друзья и единомышленники приносят поддержку и идеи. Присоединитесь к компании, ответьте на старые сообщения, поделитесь планами.",
    },
    {
      en: "Your hopes for the future become clearer. A good day for new acquaintances and for anything you do together with others.",
      ru: "Надежды на будущее становятся яснее. Удачный день для новых знакомств и для того, что вы делаете вместе с другими.",
    },
  ],
  [
    {
      en: "Energy is lower and turned inward. Don't overload your schedule: rest, sleep and quiet reflection give the most today.",
      ru: "Сил меньше, и они обращены внутрь. Не перегружайте расписание: отдых, сон и спокойные размышления дадут сегодня больше всего.",
    },
    {
      en: "A quiet day behind the scenes. Finish what has been pending, listen to your intuition and leave big launches for later.",
      ru: "Тихий день за кулисами. Завершите отложенное, прислушайтесь к интуиции, а крупные начинания оставьте на потом.",
    },
  ],
];

/**
 * Поправки к оценкам дня по дому Луны (индекс 0 — 1-й дом): любовь, дела, энергия. База — 3 из 5,
 * итог дополнительно сдвигается фазой Луны и небольшим детерминированным разбросом по дню.
 */
export const HOUSE_RATING_SHIFTS: readonly { love: number; work: number; energy: number }[] = [
  { love: 0, work: 0, energy: 2 },
  { love: 0, work: 1, energy: 0 },
  { love: 0, work: 1, energy: 1 },
  { love: 1, work: 0, energy: -1 },
  { love: 2, work: 0, energy: 1 },
  { love: 0, work: 2, energy: 0 },
  { love: 2, work: 0, energy: 0 },
  { love: 1, work: 0, energy: -1 },
  { love: 0, work: 0, energy: 1 },
  { love: 0, work: 2, energy: 0 },
  { love: 1, work: 0, energy: 1 },
  { love: 0, work: -1, energy: -2 },
];

export const MOON_PHASE_NOTES: Record<MoonPhase, Bilingual> = {
  new: { en: "New Moon: a time to set intentions rather than chase results.", ru: "Новолуние: время ставить намерения, а не добиваться результата." },
  waxing_crescent: { en: "The Moon is waxing: new undertakings gather strength step by step.", ru: "Луна растёт: новые начинания понемногу набирают силу." },
  first_quarter: {
    en: "First quarter: the first obstacles show where the plan needs adjusting.",
    ru: "Первая четверть: первые препятствия показывают, где план нужно поправить.",
  },
  waxing_gibbous: {
    en: "The Moon is nearly full: refine and polish what you have started.",
    ru: "Луна почти полная: доводите до ума то, что начато.",
  },
  full: { en: "Full Moon: emotions peak, and what was hidden becomes obvious.", ru: "Полнолуние: эмоции на пике, а скрытое становится явным." },
  waning_gibbous: { en: "The Moon is waning: share what you have learned and say thank you.", ru: "Луна убывает: делитесь тем, чему научились, и благодарите." },
  last_quarter: { en: "Last quarter: a good time to clear out what you no longer need.", ru: "Последняя четверть: хорошее время избавиться от лишнего." },
  waning_crescent: {
    en: "The last days of the lunar cycle: rest and wrap things up before a new one begins.",
    ru: "Последние дни лунного цикла: отдыхайте и завершайте дела перед новым началом.",
  },
};

/** Совет дня по стихии знака читателя; выбирается детерминированно по дню. */
export const ELEMENT_ADVICE: Record<Element, readonly Bilingual[]> = {
  fire: [
    { en: "Turn impatience into movement: a walk or a workout will clear your head.", ru: "Направьте нетерпение в движение: прогулка или тренировка прояснят голову." },
    { en: "Count to ten before you answer: your first impulse is not always your best one.", ru: "Прежде чем ответить, сосчитайте до десяти: первый порыв не всегда лучший." },
    { en: "Finish one thing before you take on the next.", ru: "Закончите одно дело, прежде чем браться за следующее." },
    { en: "Share your enthusiasm, but leave room for other people's pace.", ru: "Делитесь воодушевлением, но оставляйте место для чужого темпа." },
    { en: "Do one brave thing you have been putting off.", ru: "Сделайте одно смелое дело, которое давно откладывали." },
    { en: "Praise someone sincerely: the warmth will come back to you.", ru: "Искренне похвалите кого-нибудь: тепло вернётся к вам." },
  ],
  earth: [
    { en: "Allow yourself one small change to your usual routine.", ru: "Позвольте себе одно небольшое изменение в привычном распорядке." },
    { en: "Write down three concrete tasks and stop when they are done.", ru: "Запишите три конкретные задачи и остановитесь, когда выполните их." },
    { en: "Look after your body: water, sleep, a proper meal.", ru: "Позаботьтесь о теле: вода, сон, нормальная еда." },
    { en: "Don't confuse stubbornness with reliability: hear out another opinion.", ru: "Не путайте упрямство с надёжностью: выслушайте другое мнение." },
    { en: "Spend a few minutes outdoors: nature brings back your balance.", ru: "Проведите несколько минут на улице: природа возвращает равновесие." },
    { en: "Finish what you have started instead of starting over.", ru: "Доведите начатое до конца, вместо того чтобы начинать заново." },
  ],
  air: [
    { en: "Put your phone away for an hour: ideas take shape in silence.", ru: "Отложите телефон на час: в тишине идеи обретают форму." },
    { en: "Turn one idea into action today, even a small one.", ru: "Превратите одну идею в действие уже сегодня, пусть даже маленькое." },
    { en: "Ask a question instead of guessing the answer.", ru: "Задайте вопрос вместо того, чтобы додумывать ответ." },
    { en: "Pay attention to feelings, not only to arguments.", ru: "Обращайте внимание на чувства, а не только на доводы." },
    { en: "Write your thoughts down: on paper they become clearer.", ru: "Запишите свои мысли: на бумаге они становятся яснее." },
    { en: "Call someone you haven't spoken to in a long time.", ru: "Позвоните тому, с кем давно не говорили." },
  ],
  water: [
    { en: "Protect your energy: you don't have to carry other people's moods.", ru: "Берегите силы: вы не обязаны носить на себе чужое настроение." },
    { en: "Trust your intuition, but check the facts.", ru: "Доверяйте интуиции, но проверяйте факты." },
    { en: "Say out loud what you feel instead of waiting to be guessed.", ru: "Скажите вслух, что чувствуете, а не ждите, что вас угадают." },
    { en: "Water helps: a bath, a shower or a walk by the river.", ru: "Помогает вода: ванна, душ или прогулка у реки." },
    { en: "Let go of an old grudge: it costs you more than it costs them.", ru: "Отпустите старую обиду: она забирает у вас больше, чем у другого." },
    { en: "Make something with your hands: a drawing, a dish, a tune.", ru: "Создайте что-нибудь своими руками: рисунок, блюдо, мелодию." },
  ],
};

export const MERCURY_RETROGRADE_NOTE: Bilingual = {
  en: "Mercury is retrograde: double-check messages, documents and plans, and allow time for delays.",
  ru: "Меркурий ретрограден: перепроверяйте сообщения, документы и планы и закладывайте время на задержки.",
};

/** Знак в предложном падеже для подписей «Луна в …»: «в Овне», «во Льве». */
export const SIGN_LOCATIVE_RU: Record<ZodiacSignId, string> = {
  aries: "в Овне",
  taurus: "в Тельце",
  gemini: "в Близнецах",
  cancer: "в Раке",
  leo: "во Льве",
  virgo: "в Деве",
  libra: "в Весах",
  scorpio: "в Скорпионе",
  sagittarius: "в Стрельце",
  capricorn: "в Козероге",
  aquarius: "в Водолее",
  pisces: "в Рыбах",
};
