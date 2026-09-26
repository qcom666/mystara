import type { Metadata } from "next";
import { TarotSpreadsContent } from "@/components/tarot/tarot-spreads-content";

export const metadata: Metadata = {
  title: "Tarot Spreads",
  description: "Explore Tarot spreads — One Card, Three Card, Celtic Cross, Love, Career, and more — and what each position means.",
};

export default function TarotSpreadsIndexPage() {
  return <TarotSpreadsContent />;
}
