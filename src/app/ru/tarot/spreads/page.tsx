import type { Metadata } from "next";
import { localizedMetadata } from "@/lib/seo/page-metadata";

export { default } from "@/app/tarot/spreads/page";

export const metadata: Metadata = localizedMetadata({
  path: "/tarot/spreads",
  locale: "ru",
  title: "Расклады Таро",
  description: "Расклады Таро на одну и три карты, Кельтский крест, расклады на любовь и работу: что означает каждая позиция.",
});
