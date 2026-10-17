import type { Metadata } from "next";
import { TarotCardsContent } from "@/components/tarot/tarot-cards-content";
import { languageAlternates } from "@/lib/i18n/localized-routes";

export const metadata: Metadata = {
  alternates: languageAlternates("/tarot/cards", "en"),
  title: "Tarot Card Meanings",
  description: "Browse all 78 Tarot cards — Major and Minor Arcana — with upright, reversed, love, career, finance, and spiritual meanings.",
};

export default function TarotCardsIndexPage() {
  return <TarotCardsContent />;
}
