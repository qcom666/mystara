import type { Metadata } from "next";
import { SpreadPickerPage } from "@/components/reading/spread-picker-page";
import { auth } from "@/lib/auth";
import { getAllSpreads } from "@/modules/tarot/domain/spreads.data";
import { languageAlternates } from "@/lib/i18n/localized-routes";

export const metadata: Metadata = {
  alternates: languageAlternates("/reading", "en"),
  title: "Choose a Tarot Spread",
  description: "Pick a Tarot spread — One Card, Three Card, Celtic Cross, Love, Career, and more — to begin your reading.",
};

export default async function ReadingIndexPage() {
  const session = await auth().catch(() => null);
  const planTier = session?.user?.planTier ?? "free";

  return <SpreadPickerPage spreads={getAllSpreads()} planTier={planTier} />;
}
