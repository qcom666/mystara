import type { Metadata } from "next";
import { localizedMetadata } from "@/lib/seo/page-metadata";

export { default } from "@/app/tarot/cards/page";

export const metadata: Metadata = localizedMetadata({
  path: "/tarot/cards",
  locale: "ru",
  title: "Значения карт Таро",
  description: "Все 78 карт Таро, Старшие и Младшие Арканы: прямое и перевёрнутое значение, в любви, работе, финансах и духовном развитии.",
});
