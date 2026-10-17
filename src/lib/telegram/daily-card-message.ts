import { getCardMeanings, getCardName } from "@/modules/tarot/domain/deck";
import type { DailyCard } from "@/modules/tarot/services/daily-card";

export type BotLang = "ru" | "en";

const COPY = {
  ru: {
    title: "Карта дня",
    reversed: " (перевёрнутая)",
    reflection: "Это повод для размышления, а не предсказание.",
    open: "Открыть Mystara",
    subscribed: "Готово: каждое утро около 9:00 по Москве я буду присылать карту дня. Отписаться: /daily off",
    unsubscribed: "Вы отписались от карты дня. Вернуться можно в любой момент: /daily",
  },
  en: {
    title: "Card of the day",
    reversed: " (reversed)",
    reflection: "Something to reflect on, not a prediction.",
    open: "Open Mystara",
    subscribed: "Done: every morning around 9:00 Moscow time I'll send you a card of the day. To stop: /daily off",
    unsubscribed: "You've unsubscribed from the card of the day. Come back any time: /daily",
  },
} as const;

/** Первое предложение значения: в сообщении нужна короткая мысль, а полный текст ждёт в приложении. */
function firstSentence(text: string): string {
  const match = /^(.+?[.!?])(\s|$)/.exec(text.trim());
  return match ? match[1] : text.trim();
}

export function dailyCardText(daily: DailyCard, lang: BotLang): string {
  const copy = COPY[lang];
  const meanings = getCardMeanings(daily.card, lang);
  const meaning = daily.orientation === "reversed" ? meanings.reversed : meanings.upright;
  const name = getCardName(daily.card, lang) + (daily.orientation === "reversed" ? copy.reversed : "");
  return `🃏 ${copy.title}: ${name}\n\n${firstSentence(meaning)}\n\n${copy.reflection}`;
}

export function dailyCardKeyboard(lang: BotLang, appUrl: string, cardId: string) {
  return { inline_keyboard: [[{ text: COPY[lang].open, web_app: { url: `${appUrl}/tarot/cards/${cardId}` } }]] };
}

export function subscriptionText(lang: BotLang, subscribed: boolean): string {
  return subscribed ? COPY[lang].subscribed : COPY[lang].unsubscribed;
}
