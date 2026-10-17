import type { Metadata } from "next";
import { localizedMetadata } from "@/lib/seo/page-metadata";

export { default } from "@/app/page";

export const metadata: Metadata = localizedMetadata({
  path: "/",
  locale: "ru",
  title: "Mystara — расклады Таро онлайн, гороскоп и нумерология",
  description: "Бесплатные расклады Таро онлайн, значения 78 карт, гороскоп на сегодня, совместимость знаков, нумерология и натальная карта. Толкования для размышления и самопознания.",
  absoluteTitle: true,
});
