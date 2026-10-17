import type { Metadata } from "next";
import { localizedMetadata } from "@/lib/seo/page-metadata";

export { default } from "@/app/pricing/page";

export const metadata: Metadata = localizedMetadata({
  path: "/pricing",
  locale: "ru",
  title: "Тарифы",
  description: "Бесплатные расклады каждый день или Premium без ограничений: тарифы Mystara и пакеты натальной карты.",
});
