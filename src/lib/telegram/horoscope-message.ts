import { getAllZodiacSigns, localizeZodiacSign } from "@/modules/astrology/domain/zodiac-signs.data";
import type { ZodiacSignId } from "@/modules/astrology/domain/types";
import type { DailyHoroscope } from "@/modules/astrology/services/daily-horoscope";
import type { BotLang } from "./daily-card-message";

const COPY = {
  ru: {
    title: "гороскоп на",
    ratings: { love: "Любовь", work: "Дела", energy: "Энергия" },
    advice: "Совет",
    reflection: "Это повод для размышления, а не предсказание.",
    open: "Подробнее в Mystara",
    pick: "Выберите знак, или напишите, например: /horoscope Лев",
    locale: "ru-RU",
  },
  en: {
    title: "horoscope for",
    ratings: { love: "Love", work: "Work", energy: "Energy" },
    advice: "Advice",
    reflection: "Something to reflect on, not a prediction.",
    open: "Read more in Mystara",
    pick: "Pick a sign, or type, for example: /horoscope Leo",
    locale: "en-US",
  },
} as const;

const normalize = (value: string) => value.trim().toLowerCase().replaceAll("ё", "е");

/** Знак из аргумента команды: «Лев», «лев», «Leo», «leo». Неизвестное слово → null. */
export function parseSignArgument(text: string): ZodiacSignId | null {
  const argument = normalize(text.replace(/^\/\w+(?:@\w+)?/, ""));
  if (!argument) return null;
  const sign = getAllZodiacSigns().find((candidate) => [candidate.id, candidate.name, candidate.nameRu].some((name) => normalize(name) === argument));
  return sign?.id ?? null;
}

function dots(value: number): string {
  return "●".repeat(value) + "○".repeat(5 - value);
}

function formatDay(day: string, lang: BotLang): string {
  const [year, month, date] = day.split("-").map(Number);
  return new Intl.DateTimeFormat(COPY[lang].locale, { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, date)));
}

export function horoscopeText(horoscope: DailyHoroscope, lang: BotLang): string {
  const copy = COPY[lang];
  const base = getAllZodiacSigns().find((sign) => sign.id === horoscope.sign);
  const sign = base ? localizeZodiacSign(base, lang) : null;
  const ratings = (["love", "work", "energy"] as const).map((key) => `${copy.ratings[key]} ${dots(horoscope.ratings[key])}`).join("\n");
  return [
    `${sign?.symbol ?? ""} ${sign?.name ?? horoscope.sign} — ${copy.title} ${formatDay(horoscope.day, lang)}`,
    horoscope.theme[lang],
    `${horoscope.mood[lang]} ${horoscope.phase[lang]}${horoscope.mercury ? `\n${horoscope.mercury[lang]}` : ""}`,
    ratings,
    `${copy.advice}: ${horoscope.advice[lang]}`,
    copy.reflection,
  ].join("\n\n");
}

export function horoscopeKeyboard(lang: BotLang, appUrl: string, sign: ZodiacSignId) {
  return { inline_keyboard: [[{ text: COPY[lang].open, web_app: { url: `${appUrl}/astrology/horoscope/${sign}` } }]] };
}

/** Двенадцать кнопок по три в ряд: каждая открывает гороскоп знака в мини-приложении. */
export function signPickerKeyboard(lang: BotLang, appUrl: string) {
  const buttons = getAllZodiacSigns().map((base) => {
    const sign = localizeZodiacSign(base, lang);
    return { text: `${sign.symbol} ${sign.name}`, web_app: { url: `${appUrl}/astrology/horoscope/${sign.id}` } };
  });
  const rows = [];
  for (let i = 0; i < buttons.length; i += 3) rows.push(buttons.slice(i, i + 3));
  return { inline_keyboard: rows };
}

export function signPickerText(lang: BotLang): string {
  return COPY[lang].pick;
}
