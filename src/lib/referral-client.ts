/**
 * Код приглашения в браузере: запоминается при заходе по ссылке `?ref=КОД` на 30 дней и отправляется при
 * создании аккаунта (регистрация по e-mail или первый вход через Telegram). Сервер всё равно проверяет код
 * и привязывает приглашение только к новому аккаунту.
 */
const STORAGE_KEY = "mystara-ref";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function rememberReferralFromUrl(): void {
  try {
    const code = new URLSearchParams(window.location.search).get("ref");
    if (code && /^[A-Za-z0-9_]{4,20}$/.test(code)) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ code, at: Date.now() }));
    }
  } catch {
    /* хранилище недоступно: приглашение просто не запомнится */
  }
}

export function getRememberedReferral(): string | undefined {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const { code, at } = JSON.parse(raw) as { code?: string; at?: number };
    if (!code || !at || Date.now() - at > TTL_MS) return undefined;
    return code;
  } catch {
    return undefined;
  }
}
