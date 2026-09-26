import type { Metadata } from "next";
import { TarotCardsContent } from "@/components/tarot/tarot-cards-content";

export const metadata: Metadata = {
  title: "Tarot Card Meanings",
  description: "Browse all 78 Tarot cards — Major and Minor Arcana — with upright, reversed, love, career, finance, and spiritual meanings.",
};

export default function TarotCardsIndexPage() {
  return <TarotCardsContent />;
}
