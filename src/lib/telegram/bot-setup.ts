import { telegramApiUrl } from "./bot-api";

/**
 * Настройка бота через Bot API: команды, описание, кнопка меню с Mini App и (по желанию) вебхук. То же
 * самое можно сделать руками в @BotFather; здесь тексты и порядок собраны в одном месте, чтобы настройку
 * можно было повторить одной командой (`npm run bot:setup`) или кнопкой в админ-панели на любом домене.
 * `buildBotSetupRequests` — чистая функция: возвращает список запросов и ничего не отправляет.
 */

export interface BotApiRequest {
  method: string;
  body: Record<string, unknown>;
}

export interface BotSetupOptions {
  /** Публичный адрес сайта: https, без слэша в конце. */
  siteUrl: string;
  /** Секрет вебхука; если задан, в набор добавляется setWebhook. */
  webhookSecret?: string;
}

const COMMANDS = {
  ru: [
    { command: "start", description: "Открыть Mystara" },
    { command: "card", description: "Карта дня" },
    { command: "horoscope", description: "Гороскоп на сегодня (например, /horoscope Лев)" },
    { command: "daily", description: "Карта дня каждое утро (/daily off - отписаться)" },
    { command: "help", description: "Как это работает" },
    { command: "docs", description: "Политика, оферта, контакты" },
    { command: "support", description: "Связаться с поддержкой" },
  ],
  en: [
    { command: "start", description: "Open Mystara" },
    { command: "card", description: "Card of the day" },
    { command: "horoscope", description: "Today's horoscope (e.g. /horoscope Leo)" },
    { command: "daily", description: "Card of the day every morning (/daily off to stop)" },
    { command: "help", description: "How it works" },
    { command: "docs", description: "Privacy, offer, contacts" },
    { command: "support", description: "Contact support" },
  ],
} as const;

const DESCRIPTION = {
  ru: "Mystara: расклады Таро, нумерология, астрология и натальная карта. Ясность через символы и толкования. Развлекательный сервис: расклады не являются предсказанием.",
  en: "Mystara: tarot spreads, numerology, astrology and natal charts. Clarity through symbolism and interpretation. An entertainment service: readings are not predictions.",
} as const;

const SHORT_DESCRIPTION = {
  ru: "Таро, нумерология и астрология в одном приложении",
  en: "Tarot, numerology and astrology in one app",
} as const;

export function buildBotSetupRequests({ siteUrl, webhookSecret }: BotSetupOptions): BotApiRequest[] {
  if (!/^https:\/\/[^/\s]+$/.test(siteUrl)) {
    throw new Error("Адрес сайта должен быть вида https://example.ru, без слэша в конце: Telegram не принимает другие.");
  }

  const requests: BotApiRequest[] = [
    // Без language_code - команды для всех, остальные языки переопределяют их.
    { method: "setMyCommands", body: { commands: COMMANDS.en } },
    { method: "setMyCommands", body: { commands: COMMANDS.ru, language_code: "ru" } },
    { method: "setMyDescription", body: { description: DESCRIPTION.en } },
    { method: "setMyDescription", body: { description: DESCRIPTION.ru, language_code: "ru" } },
    { method: "setMyShortDescription", body: { short_description: SHORT_DESCRIPTION.en } },
    { method: "setMyShortDescription", body: { short_description: SHORT_DESCRIPTION.ru, language_code: "ru" } },
    { method: "setChatMenuButton", body: { menu_button: { type: "web_app", text: "Mystara", web_app: { url: siteUrl } } } },
  ];

  if (webhookSecret) {
    requests.push({
      method: "setWebhook",
      body: {
        url: `${siteUrl}/api/telegram/webhook`,
        secret_token: webhookSecret,
        // subscription — отмена, возобновление и неудачное списание подписки Звёздами с автопродлением.
        allowed_updates: ["message", "pre_checkout_query", "subscription"],
        drop_pending_updates: false,
      },
    });
  }
  return requests;
}

export interface BotSetupResult {
  /** Метод и язык, например «setMyCommands (ru)». */
  label: string;
  ok: boolean;
  /** Ответ Telegram при ошибке (без токена). */
  error: string | null;
}

/** Отправляет запросы настройки по очереди и возвращает результат каждого. Токен в результат не попадает. */
export async function applyBotSetupRequests(
  botToken: string,
  requests: BotApiRequest[],
  fetchImpl: typeof fetch = fetch,
): Promise<BotSetupResult[]> {
  const results: BotSetupResult[] = [];
  for (const request of requests) {
    const label = `${request.method}${request.body.language_code ? ` (${String(request.body.language_code)})` : ""}`;
    try {
      const response = await fetchImpl(telegramApiUrl(botToken, request.method), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request.body),
        signal: AbortSignal.timeout(8000),
      });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
      const ok = response.ok && data?.ok === true;
      results.push({ label, ok, error: ok ? null : (data?.description ?? `HTTP ${response.status}`) });
    } catch {
      results.push({ label, ok: false, error: "network error" });
    }
  }
  return results;
}

export interface WebhookInfo {
  url: string;
  allowedUpdates: string[] | null;
  pendingUpdateCount: number;
  lastErrorMessage: string | null;
  lastErrorDate: string | null;
}

/** Текущее состояние вебхука у Telegram (getWebhookInfo): адрес, список обновлений, последняя ошибка. */
export async function fetchWebhookInfo(botToken: string, fetchImpl: typeof fetch = fetch): Promise<WebhookInfo | null> {
  try {
    const response = await fetchImpl(telegramApiUrl(botToken, "getWebhookInfo"), { method: "POST", signal: AbortSignal.timeout(8000) });
    const data = (await response.json().catch(() => null)) as {
      ok?: boolean;
      result?: { url?: string; allowed_updates?: string[]; pending_update_count?: number; last_error_message?: string; last_error_date?: number };
    } | null;
    if (!response.ok || !data?.ok || !data.result) return null;
    return {
      url: data.result.url ?? "",
      allowedUpdates: data.result.allowed_updates ?? null,
      pendingUpdateCount: data.result.pending_update_count ?? 0,
      lastErrorMessage: data.result.last_error_message ?? null,
      lastErrorDate: data.result.last_error_date ? new Date(data.result.last_error_date * 1000).toISOString() : null,
    };
  } catch {
    return null;
  }
}
