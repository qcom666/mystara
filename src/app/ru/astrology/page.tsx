import type { Metadata } from "next";
import { localizedMetadata } from "@/lib/seo/page-metadata";

export { default } from "@/app/astrology/page";

export const metadata: Metadata = localizedMetadata({
  path: "/astrology",
  locale: "ru",
  title: "Астрология: узнать свой знак зодиака",
  description: "Определите свой знак зодиака по дате рождения и узнайте, что он традиционно означает. Гороскоп на сегодня и совместимость знаков.",
});
