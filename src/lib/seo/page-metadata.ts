import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n";
import { languageAlternates, toRussianPath } from "@/lib/i18n/localized-routes";

/** Описание для поисковиков: не длиннее ~160 символов, обрезается по границе слова. */
export function shortDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max / 2)).replace(/[,;:.\s—-]+$/, "")}…`;
}

interface LocalizedMetadataInput {
  /** Адрес страницы без языкового префикса, например `/tarot/cards/the-fool`. */
  path: string;
  locale: Locale;
  title: string;
  description: string;
  /** true — заголовок целиком, без шаблона «… · Mystara» из корневого layout. */
  absoluteTitle?: boolean;
}

/**
 * Metadata страницы, у которой есть английская и русская версии: заголовок и описание на языке версии,
 * canonical и hreflang на обе (lib/i18n/localized-routes.ts), Open Graph с нужной локалью.
 */
export function localizedMetadata({ path, locale, title, description, absoluteTitle = false }: LocalizedMetadataInput): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} · Mystara`;
  const summary = shortDescription(description);
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description: summary,
    alternates: languageAlternates(path, locale),
    openGraph: {
      title: fullTitle,
      description: summary,
      type: "website",
      siteName: "Mystara",
      locale: locale === "ru" ? "ru_RU" : "en_US",
      url: locale === "ru" ? toRussianPath(path) : path,
    },
    twitter: { card: "summary_large_image", title: fullTitle, description: summary },
  };
}
