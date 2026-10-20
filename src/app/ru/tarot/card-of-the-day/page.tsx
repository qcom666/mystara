import type { Metadata } from "next";
import { localizedMetadata } from "@/lib/seo/page-metadata";

export { default } from "@/app/tarot/card-of-the-day/page";

export const metadata: Metadata = localizedMetadata({
  path: "/tarot/card-of-the-day",
  locale: "ru",
  title: "Карта дня Таро онлайн бесплатно",
  description: "Откройте свою карту дня Таро: одна карта на сутки и её значение в любви, делах и для души.",
});
