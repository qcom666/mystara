import type { Metadata } from "next";
import { AstrologyFlow } from "@/components/astrology/astrology-flow";
import { ExploreSigns } from "@/components/astrology/explore-signs";
import { NatalChartTeaser } from "@/components/astrology/natal-chart-teaser";
import { languageAlternates } from "@/lib/i18n/localized-routes";

export const metadata: Metadata = {
  alternates: languageAlternates("/astrology", "en"),
  title: "Astrology — Sun Sign",
  description: "Find your zodiac sun sign from your date of birth and see what it traditionally represents.",
};

export default function AstrologyPage() {
  return (
    <>
      <AstrologyFlow />
      <NatalChartTeaser />
      <ExploreSigns />
    </>
  );
}
