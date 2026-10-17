const PRODUCTION_API = "https://api.telegram.org";

/**
 * Адрес метода Bot API. TELEGRAM_API_BASE подменяет сервер только вне рабочего режима (локальная проверка
 * на заглушке Telegram); в сборке для Vercel (NODE_ENV=production) всегда используется настоящий адрес.
 */
export function telegramApiUrl(botToken: string, method: string): string {
  const override = process.env.NODE_ENV !== "production" ? process.env.TELEGRAM_API_BASE?.trim() : undefined;
  return `${override || PRODUCTION_API}/bot${botToken}/${method}`;
}

/**
 * Сообщение от бота. Возвращает HTTP-статус ответа Telegram (200 — доставлено, 403 — бот заблокирован или
 * пользователь ему не писал, 400 — чата нет) или null при сетевой ошибке. Исключений не бросает.
 */
export async function sendBotMessage(
  botToken: string,
  chatId: string | number,
  text: string,
  replyMarkup?: unknown,
  fetchImpl: typeof fetch = fetch,
): Promise<number | null> {
  try {
    const response = await fetchImpl(telegramApiUrl(botToken, "sendMessage"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, ...(replyMarkup ? { reply_markup: replyMarkup } : {}) }),
      signal: AbortSignal.timeout(5000),
    });
    return response.status;
  } catch {
    return null;
  }
}
