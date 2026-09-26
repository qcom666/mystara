import { PRIVACY_POLICY_VERSION } from "./operator";

export type ConsentState = "unknown" | "accepted" | "declined";

export const CONSENT_STORAGE_KEY = "mystara-privacy-consent";

/**
 * Stored as "<state>:<policy version>". A choice made under an older policy
 * version reads back as "unknown", so publishing a new policy version asks
 * everyone again instead of silently carrying an old consent over.
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
