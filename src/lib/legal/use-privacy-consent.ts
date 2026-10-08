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

// Копия последнего записанного значения: на устройстве с заблокированным хранилищем экран согласия
// всё равно пропускается до конца визита, а не показывается бесконечно.
let memoryValue: string | null = null;

function getSnapshot(): ConsentState {
  try {
    return parseConsent(window.localStorage.getItem(CONSENT_STORAGE_KEY) ?? memoryValue);
  } catch {
    return parseConsent(memoryValue);
  }
}

/** Сервер и первая отрисовка всегда сообщают «unknown»; реальное значение появляется после гидратации. */
function getServerSnapshot(): ConsentState {
  return "unknown";
}

/**
 * Запоминает выбор посетителя на этом устройстве. localStorage — только кэш для удобства: проверяемая
 * запись согласия хранится в строке пользователя (см. /api/privacy/consent).
 */
export function setPrivacyConsent(state: Exclude<ConsentState, "unknown">): void {
  memoryValue = serializeConsent(state);
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, memoryValue);
  } catch {
    // Хранилище заблокировано (приватный режим и т.п.): выбор просто не сохранится между визитами.
  }
  window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
}

export function usePrivacyConsent(): ConsentState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
