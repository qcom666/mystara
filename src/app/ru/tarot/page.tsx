import type { Metadata } from "next";
import { localizedMetadata } from "@/lib/seo/page-metadata";

export { default } from "@/app/tarot/page";

export const metadata: Metadata = localizedMetadata({
  path: "/tarot",
  locale: "ru",
  title: "Таро для начинающих: значения карт и расклады",
  description: "Как научиться читать Таро: значения всех 78 карт, популярные расклады и пошаговое руководство, как сделать расклад самостоятельно.",
});
