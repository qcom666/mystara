import type { Metadata } from "next";
import { PricingContent } from "@/components/marketing/pricing-content";
import { languageAlternates } from "@/lib/i18n/localized-routes";

export const metadata: Metadata = {
  alternates: languageAlternates("/pricing", "en"),
  title: "Pricing",
  description: "Start free with limited daily Tarot readings, or upgrade to Premium for unlimited readings and advanced spreads.",
};

export default function PricingPage() {
  return <PricingContent />;
}
