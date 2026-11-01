import type { Metadata } from "next";
import { CompatibilityIndexContent } from "@/components/astrology/detailed-compatibility-view";
import { languageAlternates } from "@/lib/i18n/localized-routes";

export const metadata: Metadata = {
  alternates: languageAlternates("/astrology/compatibility/friendship", "en"),
  title: "Zodiac Friendship Compatibility",
  description: "Pick your sign and your friend's to see how strong your friendship is across 12 areas: humour, trust, support, adventures and more.",
};

export default function FriendshipCompatibilityPage() {
  return <CompatibilityIndexContent mode="friendship" />;
}
