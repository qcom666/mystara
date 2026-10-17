/**
 * Какие события и какие их поля попадают в собственную статистику. Всё, что может указать на человека
 * (id пользователя, расклада, Telegram ID, вопрос, дата рождения), отбрасывается: хранится только факт
 * события и обезличенные признаки вроде id расклада или способа оплаты.
 */
export const STORED_EVENTS = {
  landing_viewed: [],
  spread_selected: ["spreadId"],
  reading_started: ["spreadId", "hasQuestion"],
  reading_completed: ["spreadId"],
  reading_saved: [],
  reading_shared: ["spreadId", "channel"],
  numerology_calculated: [],
  astrology_calculated: ["sunSign"],
  telegram_session_started: [],
  signup_completed: [],
  checkout_started: ["product", "provider"],
  purchase_paid: ["product", "provider"],
} as const satisfies Record<string, readonly string[]>;

export type StoredEventName = keyof typeof STORED_EVENTS;

/** Порядок шагов воронки в админ-панели. */
export const FUNNEL: StoredEventName[] = [
  "landing_viewed",
  "spread_selected",
  "reading_started",
  "reading_completed",
  "reading_saved",
  "signup_completed",
  "checkout_started",
  "purchase_paid",
];

export interface SanitizedEvent {
  name: StoredEventName;
  props: Record<string, string | boolean>;
}

/** Оставляет только разрешённое; неизвестное событие или поле - null или выброшено. */
export function sanitizeEvent(input: unknown): SanitizedEvent | null {
  if (typeof input !== "object" || input === null) return null;
  const record = input as Record<string, unknown>;
  const name = record.name;
  if (typeof name !== "string" || !Object.hasOwn(STORED_EVENTS, name)) return null;
  const allowed = STORED_EVENTS[name as StoredEventName] as readonly string[];
  const props: Record<string, string | boolean> = {};
  for (const key of allowed) {
    const value = record[key];
    if (typeof value === "boolean") props[key] = value;
    else if (typeof value === "string" && /^[a-z0-9_-]{1,40}$/i.test(value)) props[key] = value;
  }
  return { name: name as StoredEventName, props };
}
