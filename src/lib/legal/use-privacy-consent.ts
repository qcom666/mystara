"use client";

import { useSyncExternalStore } from "react";
import { CONSENT_STORAGE_KEY, parseConsent, serializeConsent, type ConsentState } from "./consent-state";

const CONSENT_CHANGE_EVENT = "mystara-consent-change";

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// Mirror of the last value written, so a device with blocked storage still gets
// past the consent screen for the rest of the visit instead of seeing it forever.
let memoryValue: string | null = null;

function getSnapshot(): ConsentState {
  try {
    return parseConsent(window.localStorage.getItem(CONSENT_STORAGE_KEY) ?? memoryValue);
  } catch {
    return parseConsent(memoryValue);
  }
}

/** Server and first paint always report "unknown"; the real value lands after hydration. */
function getServerSnapshot(): ConsentState {
  return "unknown";
}

/**
 * Records the visitor's choice on this device. localStorage is a UX cache only —
 * the auditable record of a consent lives on the user row (see /api/privacy/consent).
 */
export function setPrivacyConsent(state: Exclude<ConsentState, "unknown">): void {
  memoryValue = serializeConsent(state);
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, memoryValue);
  } catch {
    // Storage blocked (private mode etc.) — the choice simply won't persist across visits.
  }
  window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
}

export function usePrivacyConsent(): ConsentState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
