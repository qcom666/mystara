"use client";

import { locales, localeLabels, useLocale, useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const t = useTranslation();

  return (
    <div
      className="flex items-center gap-0.5 rounded-full border border-white/10 bg-white/5 p-0.5"
      role="group"
      aria-label={t.common.languageLabel}
    >
      {locales.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          aria-pressed={locale === code}
          className={cn(
            "focus-ring rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
            locale === code ? "bg-gold-500/20 text-gold-300" : "text-silver-400 hover:text-silver-200",
          )}
        >
          {localeLabels[code]}
        </button>
      ))}
    </div>
  );
}
