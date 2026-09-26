import type { Metadata } from "next";
import { PricingContent } from "@/components/marketing/pricing-content";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Start free with limited daily Tarot readings, or upgrade to Premium for unlimited readings and advanced spreads.",
};

export default function PricingPage() {
  return <PricingContent />;
}
