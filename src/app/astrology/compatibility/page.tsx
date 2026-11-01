import type { Metadata } from "next";
import { CompatibilityIndexContent } from "@/components/astrology/detailed-compatibility-view";
import { languageAlternates } from "@/lib/i18n/localized-routes";

export const metadata: Metadata = {
  alternates: languageAlternates("/astrology/compatibility", "en"),
  title: "Zodiac Love Compatibility",
  description: "Pick your sign and your partner's to get a love compatibility breakdown across 12 areas: attraction, trust, communication, everyday life and more.",
};

export default function CompatibilityPage() {
  return <CompatibilityIndexContent mode="love" />;
}
