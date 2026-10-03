/**
 * Chat-side replies of the Telegram bot (the Mini App itself lives in the web app).
 *
 * Pure on purpose: `buildBotReply` takes the update Telegram POSTed to the webhook
 * and returns the reply (or null). The route handler answers with that object as the
 * HTTP response body — Telegram executes a `method` returned in a webhook response —
 * so the handler never needs the bot token or an outgoing request.
 */

export interface TelegramUpdate {
  message?: {
    text?: string;
    chat?: { id: number; type?: string };
    from?: { language_code?: string };
  };
}

export interface BotReply {
  method: "sendMessage";
  chat_id: number;
  text: string;
  reply_markup: { inline_keyboard: { text: string; web_app: { url: string } }[][] };
}

type BotLang = "ru" | "en";

const COPY: Record<BotLang, { open: string; start: string; help: string; fallback: string }> = {
  ru: {
    open: "Открыть Mystara",
    start:
      "Добро пожаловать в Mystara ✨\n\nТаро, нумерология и астрология — расклады и толкования в одном приложении. Нажмите кнопку ниже, чтобы начать.",
    help:
      "Mystara — это развлекательный сервис: расклады и толкования не являются предсказанием и не заменяют консультацию специалиста.\n\nНажмите кнопку ниже, чтобы открыть приложение. Команда /start покажет приветствие снова.",
    fallback: "Все расклады — в приложении. Нажмите кнопку ниже, чтобы открыть Mystara.",
  },
  en: {
    open: "Open Mystara",
    start:
      "Welcome to Mystara ✨\n\nTarot, numerology and astrology — readings and interpretations in one app. Tap the button below to begin.",
    help:
      "Mystara is an entertainment service: readings and interpretations are not predictions and are no substitute for professional advice.\n\nTap the button below to open the app. /start shows the greeting again.",
    fallback: "All readings live in the app. Tap the button below to open Mystara.",
  },
};

function pickLang(languageCode: string | undefined): BotLang {
  return languageCode?.toLowerCase().startsWith("ru") ? "ru" : "en";
}

/** "/start@my_bot payload" → "start"; anything that isn't a command → null. */
function parseCommand(text: string): string | null {
  const match = /^\/([a-z_]+)(?:@\w+)?(?:\s|$)/i.exec(text.trim());
  return match ? match[1].toLowerCase() : null;
}

/**
 * Reply to a private-chat text message, or null when there's nothing to say
 * (other update kinds, group chats, malformed payloads). `appUrl` must be https —
 * Telegram refuses web_app buttons with anything else.
 */
export function buildBotReply(update: TelegramUpdate, appUrl: string): BotReply | null {
  const message = update?.message;
  const chatId = message?.chat?.id;
  if (!message || typeof chatId !== "number" || message.chat?.type !== "private") return null;
  if (typeof message.text !== "string") return null;

  const copy = COPY[pickLang(message.from?.language_code)];
  const command = parseCommand(message.text);
  const text = command === "start" ? copy.start : command === "help" ? copy.help : copy.fallback;

  return {
    method: "sendMessage",
    chat_id: chatId,
    text,
    reply_markup: { inline_keyboard: [[{ text: copy.open, web_app: { url: appUrl } }]] },
  };
}
