import type { Metadata } from "next";
import { localizedMetadata } from "@/lib/seo/page-metadata";

export { default } from "@/app/astrology/compatibility/friendship/page";

export const metadata: Metadata = localizedMetadata({
  path: "/astrology/compatibility/friendship",
  locale: "ru",
  title: "Совместимость знаков зодиака в дружбе",
  description: "Выберите свой знак и знак друга — и узнайте, насколько крепка ваша дружба по 12 пунктам: юмор, доверие, поддержка, приключения и другое.",
});
