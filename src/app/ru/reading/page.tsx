import type { Metadata } from "next";
import { localizedMetadata } from "@/lib/seo/page-metadata";

export { default } from "@/app/reading/page";

export const metadata: Metadata = localizedMetadata({
  path: "/reading",
  locale: "ru",
  title: "Расклад Таро онлайн бесплатно",
  description: "Выберите расклад Таро: одна карта, три карты, Кельтский крест, на любовь или работу, и получите толкование онлайн.",
});
