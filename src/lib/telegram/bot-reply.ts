import { OPERATOR } from "@/lib/legal/operator";

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
    from?: { language_code?: string };
  };
}

type InlineButton = { text: string; web_app: { url: string } } | { text: string; url: string };

export interface BotReply {
  method: "sendMessage";
  chat_id: number;
  text: string;
  reply_markup: { inline_keyboard: InlineButton[][] };
}

type BotLang = "ru" | "en";

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
      "Mystara — это развлекательный сервис: расклады и толкования не являются предсказанием и не заменяют консультацию специалиста.\n\nНажмите кнопку ниже, чтобы открыть приложение. Команда /start покажет приветствие снова, /docs — документы, /support — как связаться с нами.",
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
      "Mystara is an entertainment service: readings and interpretations are not predictions and are no substitute for professional advice.\n\nTap the button below to open the app. /start shows the greeting again, /docs the documents, /support how to reach us.",
    fallback: "All readings live in the app. Tap the button below to open Mystara.",
    docs: "Mystara documents: the privacy policy, the public offer (also the terms of use), and the seller’s contacts and details.",
    support: (email, telegram, phone) =>
      `Mystara support.\n\nQuestions about an order, a payment or a refund — write to ${email}${telegram ? `, message Telegram support ${telegram}` : ""}${phone ? ` or call ${phone}` : ""}. We reply within 3 business days; claims within 10 days.`,
  },
};

/** Команды, которые просто показывают документы или сведения о поддержке. */
const DOCS_COMMANDS = new Set(["docs", "documents", "privacy", "policy", "terms", "offer", "contacts"]);

function pickLang(languageCode: string | undefined): BotLang {
  return languageCode?.toLowerCase().startsWith("ru") ? "ru" : "en";
}

/** «/start@my_bot payload» → «start»; всё, что не команда → null. */
function parseCommand(text: string): string | null {
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

  const copy = COPY[pickLang(message.from?.language_code)];
  const command = parseCommand(message.text);
  const openApp: InlineButton[] = [{ text: copy.open, web_app: { url: appUrl } }];

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
