import type { Metadata } from "next";
import { localizedMetadata } from "@/lib/seo/page-metadata";

export { default } from "@/app/tarot/how-to-read-tarot/page";

export const metadata: Metadata = localizedMetadata({
  path: "/tarot/how-to-read-tarot",
  locale: "ru",
  title: "Как читать карты Таро",
  description: "Руководство для начинающих: как выбрать расклад, перемешать колоду с намерением и толковать прямые и перевёрнутые карты.",
});
