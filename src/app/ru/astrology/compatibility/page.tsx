import type { Metadata } from "next";
import { localizedMetadata } from "@/lib/seo/page-metadata";

export { default } from "@/app/astrology/compatibility/page";

export const metadata: Metadata = localizedMetadata({
  path: "/astrology/compatibility",
  locale: "ru",
  title: "Совместимость знаков зодиака",
  description: "Узнайте, как два знака зодиака ладят в любви, дружбе и работе.",
});
