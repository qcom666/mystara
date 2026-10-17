/**
 * Единая абстракция аналитики. Места вызова используют `track(...)` и не меняются при смене приёмника;
 * сейчас приёмник только пишет в консоль при разработке. PostHog/Segment/GA подключаются заменой
 * `defaultSink` без правок в местах вызова.
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
  | { name: "telegram_session_started"; telegramId: string };

type AnalyticsSink = (event: AnalyticsEvent) => void;

const defaultSink: AnalyticsSink = (event) => {
  if (process.env.NODE_ENV !== "production") {
    console.debug("[analytics]", event.name, event);
  }
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
