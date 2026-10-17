"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { defaultLocale, getDictionary, isLocale, type Dictionary, type Locale } from "./dictionaries";
import { hasRussianVersion, localeFromPathname, stripLocalePrefix, toRussianPath } from "./localized-routes";

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
 * Выбор посетителя хранится только на клиенте (localStorage через `useSyncExternalStore`), а не в колонке БД
 * `User.language`: он должен работать мгновенно и для гостей, без запроса к серверу. На обычных адресах
 * сервер рендерит `defaultLocale` (английский, через `getServerSnapshot`), и сохранённый русский
 * применяется сразу после гидратации.
 *
 * На адресах `/ru/...` (lib/i18n/localized-routes.ts) язык задаёт сам адрес: и сервер, и клиент рендерят
 * русский, поэтому поисковик получает русскую страницу целиком. Такой визит запоминает русский язык и
 * для остальных страниц, а переключение на английский ведёт на английский адрес той же страницы.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const routeLocale = localeFromPathname(pathname);
  const storedLocale = useSyncExternalStore(subscribe, readLocale, getServerSnapshot);
  const locale = routeLocale ?? storedLocale;

  useEffect(() => {
    if (routeLocale && window.localStorage.getItem(STORAGE_KEY) !== routeLocale) {
      window.localStorage.setItem(STORAGE_KEY, routeLocale);
      window.dispatchEvent(new Event(LOCALE_EVENT));
    }
  }, [routeLocale]);

  const setLocale = useCallback(
    (next: Locale) => {
      window.localStorage.setItem(STORAGE_KEY, next);
      window.dispatchEvent(new Event(LOCALE_EVENT));
      // Адрес должен соответствовать языку: с русской версии уходим на английскую и наоборот.
      const path = pathname ?? "/";
      const englishPath = stripLocalePrefix(path);
      const target = next === "ru" && hasRussianVersion(englishPath) ? toRussianPath(englishPath) : next === "en" ? englishPath : path;
      if (target !== path) router.push(`${target}${window.location.search}${window.location.hash}`);
    },
    [pathname, router],
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return <LanguageContext.Provider value={{ locale, setLocale }}>{children}</LanguageContext.Provider>;
}
