import { OPERATOR } from "@/lib/legal/operator";
import { buildDailyHoroscope } from "@/modules/astrology/services/daily-horoscope";
import { getSkyOfDay } from "@/modules/astrology/services/sky-of-day";
import { dailyCard, moscowDay } from "@/modules/tarot/services/daily-card";
import { type BotLang, dailyCardKeyboard, dailyCardText, subscriptionText } from "./daily-card-message";
import { horoscopeKeyboard, horoscopeText, parseSignArgument, signPickerKeyboard, signPickerText } from "./horoscope-message";

/**
 * Ответы Telegram-бота в чате (само мини-приложение живёт в веб-приложении).
 *
 * Функция чистая намеренно: `buildBotReply` получает обновление, которое Telegram прислал на вебхук,
 * и возвращает ответ (или null). Обработчик маршрута отдаёт этот объект телом ответа (Telegram выполняет
 * `method`, возвращённый в ответе вебхука), поэтому ему не нужны ни токен бота, ни исходящие запросы.
 *
 * В каждом ответе есть кнопки юридических документов (политика, оферта/соглашение, контакты):
 * платёжные сервисы и банки хотят, чтобы они всегда были в одном нажатии внутри бота.
 */

export interface TelegramUpdate {
  message?: {
    text?: string;
    chat?: { id: number; type?: string };
    from?: { id?: number; language_code?: string };
  };
}

type InlineButton = { text: string; web_app: { url: string } } | { text: string; url: string };

export interface BotReply {
  method: "sendMessage";
  chat_id: number;
  text: string;
  reply_markup: { inline_keyboard: InlineButton[][] };
}


interface Copy {
  open: string;
  policy: string;
  offer: string;
  contacts: string;
  start: string;
  help: string;
  fallback: string;
  docs: string;
  support: (email: string, telegram: string, phone: string) => string;
}

const COPY: Record<BotLang, Copy> = {
  ru: {
    open: "Открыть Mystara",
    policy: "Политика конфиденциальности",
    offer: "Оферта и пользовательское соглашение",
    contacts: "Контакты и реквизиты",
    start:
      "Добро пожаловать в Mystara ✨\n\nТаро, нумерология и астрология — расклады и толкования в одном приложении. Нажмите кнопку ниже, чтобы начать.",
    help:
      "Mystara — это развлекательный сервис: расклады и толкования не являются предсказанием и не заменяют консультацию специалиста.\n\nНажмите кнопку ниже, чтобы открыть приложение. Команды: /card — карта дня, /horoscope Лев — гороскоп на сегодня, /daily — присылать карту дня каждое утро (/daily off — отписаться), /docs — документы, /support — как связаться с нами.",
    fallback: "Все расклады — в приложении. Нажмите кнопку ниже, чтобы открыть Mystara.",
    docs: "Документы сервиса Mystara: политика конфиденциальности, публичная оферта (она же пользовательское соглашение), контакты и реквизиты продавца.",
    support: (email, telegram, phone) =>
      `Служба поддержки Mystara.\n\nВопросы по заказу, оплате и возврату — пишите на ${email}${telegram ? `, в Telegram-поддержку ${telegram}` : ""}${phone ? ` или звоните: ${phone}` : ""}. Отвечаем в течение 3 рабочих дней, по претензиям — в течение 10 дней.`,
  },
  en: {
    open: "Open Mystara",
    policy: "Privacy Policy",
    offer: "Offer & Terms of Use",
    contacts: "Contacts & details",
    start:
      "Welcome to Mystara ✨\n\nTarot, numerology and astrology — readings and interpretations in one app. Tap the button below to begin.",
    help:
      "Mystara is an entertainment service: readings and interpretations are not predictions and are no substitute for professional advice.\n\nTap the button below to open the app. Commands: /card for the card of the day, /horoscope Leo for today's horoscope, /daily to get it every morning (/daily off to stop), /docs for the documents, /support to reach us.",
    fallback: "All readings live in the app. Tap the button below to open Mystara.",
    docs: "Mystara documents: the privacy policy, the public offer (also the terms of use), and the seller’s contacts and details.",
    support: (email, telegram, phone) =>
      `Mystara support.\n\nQuestions about an order, a payment or a refund — write to ${email}${telegram ? `, message Telegram support ${telegram}` : ""}${phone ? ` or call ${phone}` : ""}. We reply within 3 business days; claims within 10 days.`,
  },
};

/** Команды, которые просто показывают документы или сведения о поддержке. */
const DOCS_COMMANDS = new Set(["docs", "documents", "privacy", "policy", "terms", "offer", "contacts"]);

export function pickLang(languageCode: string | undefined): BotLang {
  return languageCode?.toLowerCase().startsWith("ru") ? "ru" : "en";
}

/** «/start@my_bot payload» → «start»; всё, что не команда → null. */
export function parseCommand(text: string): string | null {
  const match = /^\/([a-z_]+)(?:@\w+)?(?:\s|$)/i.exec(text.trim());
  return match ? match[1].toLowerCase() : null;
}

/** Ряды кнопок-ссылок на юридические документы. `appUrl` должен быть https: Telegram другое не принимает. */
function documentRows(copy: Copy, appUrl: string): InlineButton[][] {
  return [
    [
      { text: copy.policy, url: `${appUrl}/privacy` },
      { text: copy.offer, url: `${appUrl}/offer` },
    ],
    [{ text: copy.contacts, url: `${appUrl}/contacts` }],
  ];
}

/**
 * Ответ на текстовое сообщение в личном чате или null, если сказать нечего (другие виды обновлений,
 * групповые чаты, некорректные данные).
 */
export function buildBotReply(update: TelegramUpdate, appUrl: string): BotReply | null {
  const message = update?.message;
  const chatId = message?.chat?.id;
  if (!message || typeof chatId !== "number" || message.chat?.type !== "private") return null;
  if (typeof message.text !== "string") return null;

  const lang = pickLang(message.from?.language_code);
  const copy = COPY[lang];
  const command = parseCommand(message.text);
  const openApp: InlineButton[] = [{ text: copy.open, web_app: { url: appUrl } }];

  if (command === "card") {
    const daily = dailyCard(String(chatId), moscowDay());
    return { method: "sendMessage", chat_id: chatId, text: dailyCardText(daily, lang), reply_markup: dailyCardKeyboard(lang, appUrl, daily.card.id) };
  }

  if (command === "horoscope") {
    const sign = parseSignArgument(message.text);
    if (!sign) return { method: "sendMessage", chat_id: chatId, text: signPickerText(lang), reply_markup: signPickerKeyboard(lang, appUrl) };
    const horoscope = buildDailyHoroscope(sign, getSkyOfDay(moscowDay()));
    return { method: "sendMessage", chat_id: chatId, text: horoscopeText(horoscope, lang), reply_markup: horoscopeKeyboard(lang, appUrl, sign) };
  }

  let text: string;
  if (command === "start") text = copy.start;
  else if (command === "help") text = copy.help;
  else if (command === "support") text = copy.support(OPERATOR.email, OPERATOR.telegram, OPERATOR.phone);
  else if (command && DOCS_COMMANDS.has(command)) text = copy.docs;
  else text = copy.fallback;

  return {
    method: "sendMessage",
    chat_id: chatId,
    text,
    reply_markup: { inline_keyboard: [openApp, ...documentRows(copy, appUrl)] },
  };
}

export interface DailyCommand {
  chatId: number;
  lang: BotLang;
  action: "subscribe" | "unsubscribe";
}

/** «/daily» и «/daily on» подписывают на карту дня, «/daily off» отписывает. Только личный чат. */
export function parseDailyCommand(update: TelegramUpdate): DailyCommand | null {
  const message = update?.message;
  const chatId = message?.chat?.id;
  if (!message || typeof chatId !== "number" || message.chat?.type !== "private" || typeof message.text !== "string") return null;
  if (parseCommand(message.text) !== "daily") return null;
  const argument = message.text.trim().split(/\s+/)[1]?.toLowerCase();
  const action = argument === "off" || argument === "stop" ? "unsubscribe" : "subscribe";
  return { chatId, lang: pickLang(message.from?.language_code), action };
}

/** Ответ на /daily: подтверждение и, при подписке, сразу сегодняшняя карта. */
export function buildDailyCommandReply(command: DailyCommand, appUrl: string): BotReply {
  if (command.action === "unsubscribe") {
    return {
      method: "sendMessage",
      chat_id: command.chatId,
      text: subscriptionText(command.lang, false),
      reply_markup: { inline_keyboard: [[{ text: COPY[command.lang].open, web_app: { url: appUrl } }]] },
    };
  }
  const daily = dailyCard(String(command.chatId), moscowDay());
  return {
    method: "sendMessage",
    chat_id: command.chatId,
    text: `${subscriptionText(command.lang, true)}\n\n${dailyCardText(daily, command.lang)}`,
    reply_markup: dailyCardKeyboard(command.lang, appUrl, daily.card.id),
  };
}
