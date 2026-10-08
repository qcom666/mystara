"use client";

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { defaultLocale, getDictionary, isLocale, type Dictionary, type Locale } from "./dictionaries";

const STORAGE_KEY = "mystara-locale";
const LOCALE_EVENT = "mystara-locale-change";

function readLocale(): Locale {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored && isLocale(stored) ? stored : defaultLocale;
}

// Вызовы `setLocale` в той же вкладке не порождают нативное событие `storage` (оно приходит только
// в ДРУГИЕ вкладки): мы отправляем его сами, чтобы подписчики `useSyncExternalStore` в этой вкладке
// тоже перечитали localStorage.
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

/**
 * Активный словарь, реагирующий на выбранный пользователем язык. Заменяет прежний статический импорт
 * `t`: структура `t.section.key` в местах вызова та же, но теперь источник — хук.
 */
export function useTranslation(): Dictionary {
  const { locale } = useContext(LanguageContext);
  return getDictionary(locale);
}

export function useLocale(): LanguageContextValue {
  return useContext(LanguageContext);
}

/**
 * Хранится только на клиенте (localStorage через `useSyncExternalStore`), а не в колонке БД
 * `User.language`: выбор должен работать мгновенно и для гостей, без запроса к серверу. Сервер всегда
 * рендерит `defaultLocale` (английский, через `getServerSnapshot`); сохранённый русский применяется
 * сразу после гидратации, поэтому вернувшийся русскоязычный читатель видит короткую вспышку английского,
 * прежде чем включится его язык. Для переключателя интерфейса это приемлемо; полноценный серверный
 * выбор языка потребовал бы чтения cookie в корневом layout, а это более крупное изменение.
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
