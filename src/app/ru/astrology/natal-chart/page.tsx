import type { Metadata } from "next";
import { localizedMetadata } from "@/lib/seo/page-metadata";

export { default } from "@/app/astrology/natal-chart/page";

export const metadata: Metadata = localizedMetadata({
  path: "/astrology/natal-chart",
  locale: "ru",
  title: "Натальная карта онлайн",
  description: "Полная натальная карта по настоящим положениям планет: Луна, все планеты, асцендент, дома и аспекты между ними.",
});
