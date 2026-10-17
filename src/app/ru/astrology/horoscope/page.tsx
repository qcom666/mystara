import type { Metadata } from "next";
import { localizedMetadata } from "@/lib/seo/page-metadata";

export { default } from "@/app/astrology/horoscope/page";

// Как и у английской версии: гороскоп меняется в полночь по Москве.
export const revalidate = 600;

export const metadata: Metadata = localizedMetadata({
  path: "/astrology/horoscope",
  locale: "ru",
  title: "Гороскоп на сегодня для всех знаков зодиака",
  description: "Гороскоп на сегодня для всех двенадцати знаков: любовь, дела и энергия по настоящему положению и фазе Луны.",
});
