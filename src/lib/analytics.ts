/**
 * Единая абстракция аналитики. Места вызова используют `track(...)` и не меняются при смене приёмника.
 * В браузере событие уходит в собственную обезличенную статистику (/api/analytics, без cookie и
 * идентификаторов: сервер оставляет только поля из белого списка, см. lib/analytics-events.ts). На сервере
 * `track` ничего не пишет: серверные события записываются явно через `recordEvent` (lib/analytics-store.ts).
 */
export type AnalyticsEvent =
  | { name: "landing_viewed" }
  | { name: "signup_completed"; userId: string }
  | { name: "spread_selected"; spreadId: string }
  | { name: "reading_started"; spreadId: string; hasQuestion: boolean }
  | { name: "card_drawn"; cardId: string; positionId: string; orientation: "upright" | "reversed" }
  | { name: "reading_completed"; spreadId: string; readingId?: string }
  | { name: "ai_interpretation_requested"; spreadId: string; provider?: string }
  | { name: "reading_saved"; readingId: string }
  | { name: "reading_shared"; spreadId: string; channel: "telegram_story" | "native_share" | "image" }
  | { name: "subscription_started"; tier: "premium" }
  | { name: "numerology_calculated"; lifePathNumber: number }
  | { name: "astrology_calculated"; sunSign: string }
  | { name: "telegram_session_started"; telegramId: string }
  | { name: "spread_selected"; spreadId: string };

type AnalyticsSink = (event: AnalyticsEvent) => void;

function browserShell(): "web" | "telegram" {
  return typeof window !== "undefined" && window.Telegram?.WebApp?.initData ? "telegram" : "web";
}

const defaultSink: AnalyticsSink = (event) => {
  if (process.env.NODE_ENV !== "production") {
    console.debug("[analytics]", event.name, event);
  }
  if (typeof window === "undefined" || typeof navigator === "undefined" || typeof navigator.sendBeacon !== "function") return;
  const locale = document.documentElement.lang === "ru" ? "ru" : "en";
  const payload = JSON.stringify({ event, shell: browserShell(), locale });
  navigator.sendBeacon("/api/analytics", new Blob([payload], { type: "application/json" }));
};

let activeSink: AnalyticsSink = defaultSink;

export function setAnalyticsSink(sink: AnalyticsSink): void {
  activeSink = sink;
}

export function track(event: AnalyticsEvent): void {
  try {
    activeSink(event);
  } catch (error) {
    console.error("[analytics] sink threw", error);
  }
}
