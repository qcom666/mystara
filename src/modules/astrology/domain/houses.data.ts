/**
 * The 12 houses' classical themes, used only to compose short placement
 * text (see natal-chart-interpretation.ts) — not the full angular/
 * succedent/cadent theory, which doesn't change what's shown to a reader.
 */
export interface HouseTheme {
  number: number;
  title: string;
  titleRu: string;
  theme: string;
  themeRu: string;
}

export const HOUSE_THEMES: HouseTheme[] = [
  { number: 1, title: "Self & Identity", titleRu: "Личность и Я", theme: "how you come across and initiate things", themeRu: "то, как вы проявляетесь и начинаете дела" },
  { number: 2, title: "Resources & Values", titleRu: "Ресурсы и ценности", theme: "money, possessions, and what you value", themeRu: "деньги, имущество и то, что вы цените" },
  {
    number: 3,
    title: "Communication & Community",
    titleRu: "Общение и окружение",
    theme: "everyday communication, siblings, and short trips",
    themeRu: "повседневное общение, братья/сёстры и короткие поездки",
  },
  { number: 4, title: "Home & Roots", titleRu: "Дом и корни", theme: "home, family, and where you feel rooted", themeRu: "дом, семья и то, где вы чувствуете почву под ногами" },
  { number: 5, title: "Creativity & Romance", titleRu: "Творчество и романтика", theme: "self-expression, romance, and play", themeRu: "самовыражение, романтика и игра" },
  { number: 6, title: "Work & Routine", titleRu: "Работа и распорядок", theme: "daily work, habits, and health", themeRu: "повседневная работа, привычки и здоровье" },
  { number: 7, title: "Partnership", titleRu: "Партнёрство", theme: "close partnerships, both romantic and contractual", themeRu: "близкие партнёрства — как романтические, так и деловые" },
  {
    number: 8,
    title: "Transformation & Shared Resources",
    titleRu: "Трансформация и общие ресурсы",
    theme: "shared resources, intimacy, and deep change",
    themeRu: "общие ресурсы, близость и глубокие перемены",
  },
  {
    number: 9,
    title: "Belief & Horizons",
    titleRu: "Убеждения и горизонты",
    theme: "philosophy, travel, and the search for meaning",
    themeRu: "философия, путешествия и поиск смысла",
  },
  {
    number: 10,
    title: "Career & Reputation",
    titleRu: "Карьера и репутация",
    theme: "public role, career, and reputation",
    themeRu: "публичная роль, карьера и репутация",
  },
  {
    number: 11,
    title: "Community & Hopes",
    titleRu: "Сообщество и надежды",
    theme: "friendships, communities, and long-term hopes",
    themeRu: "дружба, сообщества и долгосрочные надежды",
  },
  {
    number: 12,
    title: "Reflection & the Unseen",
    titleRu: "Рефлексия и скрытое",
    theme: "solitude, the subconscious, and what stays unseen",
    themeRu: "уединение, подсознание и то, что остаётся скрытым",
  },
];

const HOUSES_BY_NUMBER = new Map(HOUSE_THEMES.map((house) => [house.number, house]));

export function requireHouseTheme(number: number): HouseTheme {
  const house = HOUSES_BY_NUMBER.get(number);
  if (!house) throw new Error(`Unknown house number: ${number}`);
  return house;
}

export function localizeHouseTheme(house: HouseTheme, locale: "en" | "ru"): HouseTheme {
  if (locale !== "ru") return house;
  return { ...house, title: house.titleRu, theme: house.themeRu };
}
