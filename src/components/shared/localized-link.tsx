"use client";

import NextLink from "next/link";
import { type ComponentProps, forwardRef } from "react";
import { useLocale } from "@/lib/i18n";
import { localizeHref } from "@/lib/i18n/localized-routes";

/**
 * `next/link`, который у русскоязычного посетителя ведёт на русскую версию страницы (`/ru/...`), если она
 * есть (lib/i18n/localized-routes.ts). Остальные адреса и ссылки-объекты передаются как есть.
 */
const LocalizedLink = forwardRef<HTMLAnchorElement, ComponentProps<typeof NextLink>>(function LocalizedLink({ href, ...props }, ref) {
  const { locale } = useLocale();
  return <NextLink ref={ref} href={typeof href === "string" ? localizeHref(href, locale) : href} {...props} />;
});

export default LocalizedLink;

/** То же для программной навигации (`router.push`). */
export function useLocalizedHref() {
  const { locale } = useLocale();
  return (href: string) => localizeHref(href, locale);
}
