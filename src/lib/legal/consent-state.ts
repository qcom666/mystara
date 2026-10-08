import { PRIVACY_POLICY_VERSION } from "./operator";

export type ConsentState = "unknown" | "accepted" | "declined";

export const CONSENT_STORAGE_KEY = "mystara-privacy-consent";

/**
 * Хранится как «<состояние>:<версия политики>». Выбор, сделанный при старой версии политики, читается
 * как «unknown», поэтому при публикации новой версии политики все спрашиваются заново, а старое
 * согласие не переносится молча.
 */
export function serializeConsent(state: Exclude<ConsentState, "unknown">, version: string = PRIVACY_POLICY_VERSION): string {
  return `${state}:${version}`;
}

export function parseConsent(raw: string | null, version: string = PRIVACY_POLICY_VERSION): ConsentState {
  if (!raw) return "unknown";
  const separator = raw.indexOf(":");
  if (separator === -1) return "unknown";
  const state = raw.slice(0, separator);
  const storedVersion = raw.slice(separator + 1);
  if (storedVersion !== version) return "unknown";
  return state === "accepted" || state === "declined" ? state : "unknown";
}
