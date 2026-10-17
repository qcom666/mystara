import type { Metadata } from "next";
import { localizedMetadata } from "@/lib/seo/page-metadata";

export { default } from "@/app/numerology/page";

export const metadata: Metadata = localizedMetadata({
  path: "/numerology",
  locale: "ru",
  title: "Нумерология: число жизненного пути",
  description: "Рассчитайте число жизненного пути по дате рождения и узнайте, что оно традиционно означает.",
});
