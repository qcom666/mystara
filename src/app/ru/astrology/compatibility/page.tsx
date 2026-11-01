import type { Metadata } from "next";
import { localizedMetadata } from "@/lib/seo/page-metadata";

export { default } from "@/app/astrology/compatibility/page";

export const metadata: Metadata = localizedMetadata({
  path: "/astrology/compatibility",
  locale: "ru",
  title: "Совместимость знаков зодиака в любви",
  description: "Выберите свой знак и знак партнёра — и получите разбор совместимости в любви по 12 пунктам: притяжение, доверие, общение, быт и другое.",
});
