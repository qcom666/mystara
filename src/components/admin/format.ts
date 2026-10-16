/** Вспомогательное форматирование для админ-панели (интерфейс администратора только на русском). */

export function formatDateTime(date: Date | string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDay(date: Date | string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("ru-RU", { timeZone: "Europe/Moscow", day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatMoney(amount: number, currency: string): string {
  return currency === "XTR" ? `${amount.toLocaleString("ru-RU")} ⭐` : `${amount.toLocaleString("ru-RU")} ₽`;
}

export const PRODUCT_LABELS: Record<string, string> = {
  natal_pack: "Пакет натальных карт",
  premium_month: "Premium 30 дней",
};

export const STATUS_LABELS: Record<string, string> = {
  paid: "оплачено",
  pending: "ожидает",
  failed: "не прошла",
  refunded: "возвращено",
};

/** Подпись пользователя для списков: e-mail, иначе Telegram, иначе имя, иначе id. */
export function userLabel(user: { id: string; email: string | null; name: string | null; telegramUsername: string | null }): string {
  return user.email ?? (user.telegramUsername ? `@${user.telegramUsername}` : (user.name ?? user.id));
}
