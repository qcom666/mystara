import { describe, expect, it } from "vitest";
import { buildBotReply, type TelegramUpdate } from "./bot-reply";

const APP_URL = "https://example.vercel.app";

function privateMessage(text: string, languageCode?: string): TelegramUpdate {
  return { message: { text, chat: { id: 42, type: "private" }, from: { language_code: languageCode } } };
}

describe("buildBotReply", () => {
  it("greets /start in Russian with a Mini App button", () => {
    const reply = buildBotReply(privateMessage("/start", "ru"), APP_URL);
    expect(reply?.method).toBe("sendMessage");
    expect(reply?.chat_id).toBe(42);
    expect(reply?.text).toContain("Добро пожаловать");
    expect(reply?.reply_markup.inline_keyboard[0][0]).toEqual({
      text: "Открыть Mystara",
      web_app: { url: APP_URL },
    });
  });

  it("falls back to English for other and missing languages", () => {
    expect(buildBotReply(privateMessage("/start", "de"), APP_URL)?.text).toContain("Welcome");
    expect(buildBotReply(privateMessage("/start"), APP_URL)?.text).toContain("Welcome");
  });

  it("handles /start with a payload and the @botname suffix", () => {
    expect(buildBotReply(privateMessage("/start ref123", "en"), APP_URL)?.text).toContain("Welcome");
    expect(buildBotReply(privateMessage("/start@mystara_tarot_bot", "en"), APP_URL)?.text).toContain("Welcome");
  });

  it("answers /help with the entertainment disclaimer", () => {
    expect(buildBotReply(privateMessage("/help", "ru"), APP_URL)?.text).toContain("развлекательный");
    expect(buildBotReply(privateMessage("/help", "en"), APP_URL)?.text).toContain("entertainment");
  });

  it("points anything else back to the app", () => {
    const reply = buildBotReply(privateMessage("что меня ждёт?", "ru"), APP_URL);
    expect(reply?.text).toContain("в приложении");
    expect(reply?.reply_markup.inline_keyboard[0][0].web_app.url).toBe(APP_URL);
  });

  it("stays silent for group chats, non-text messages and other updates", () => {
    expect(buildBotReply({ message: { text: "/start", chat: { id: 1, type: "group" } } }, APP_URL)).toBeNull();
    expect(buildBotReply({ message: { chat: { id: 1, type: "private" } } }, APP_URL)).toBeNull();
    expect(buildBotReply({}, APP_URL)).toBeNull();
    expect(buildBotReply(null as unknown as TelegramUpdate, APP_URL)).toBeNull();
  });
});
