"use client";

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { defaultLocale, getDictionary, isLocale, type Dictionary, type Locale } from "./dictionaries";

const STORAGE_KEY = "mystara-locale";
const LOCALE_EVENT = "mystara-locale-change";

function readLocale(): Locale {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored && isLocale(stored) ? stored : defaultLocale;
}

// Same-tab `setLocale` calls don't fire the native `storage` event (that only
// reaches OTHER tabs) — dispatching this ourselves is what makes this tab's
// own `useSyncExternalStore` subscribers re-read localStorage too.
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(LOCALE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(LOCALE_EVENT, callback);
  };
}

function getServerSnapshot(): Locale {
  return defaultLocale;
}

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: defaultLocale,
  setLocale: () => {},
});

/** The active dictionary, reactive to the user's chosen language. Replaces the old static `t` import — same `t.section.key` shape at every call site, just sourced from a hook now. */
export function useTranslation(): Dictionary {
  const { locale } = useContext(LanguageContext);
  return getDictionary(locale);
}

export function useLocale(): LanguageContextValue {
  return useContext(LanguageContext);
}

/**
 * Client-only persistence (localStorage via `useSyncExternalStore`),
 * deliberately not the `User.language` DB column — this needs to work
 * instantly for guests too, with no request round trip. The server always
 * renders `defaultLocale` (English, via `getServerSnapshot`); a stored
 * Russian preference applies right after hydration, so a returning RU reader
 * sees a brief English flash before their language kicks in. Acceptable
 * trade-off for a chrome-only switcher; true SSR-correct locale would need a
 * cookie read in the root layout, a bigger change than this warrants.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, readLocale, getServerSnapshot);

  const setLocale = useCallback((next: Locale) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(LOCALE_EVENT));
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return <LanguageContext.Provider value={{ locale, setLocale }}>{children}</LanguageContext.Provider>;
}
