import type { Metadata } from "next";
import { NatalChartFlow } from "@/components/astrology/natal-chart-flow";
import { languageAlternates } from "@/lib/i18n/localized-routes";

export const metadata: Metadata = {
  alternates: languageAlternates("/astrology/natal-chart", "en"),
  title: "Natal Chart",
  description: "A full natal chart computed from real planetary positions — the Moon, every planet, your rising sign, houses, and aspects.",
};

export default function NatalChartPage() {
  return <NatalChartFlow />;
}
