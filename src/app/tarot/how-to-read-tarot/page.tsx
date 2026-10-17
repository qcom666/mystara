import type { Metadata } from "next";
import { HowToReadContent } from "@/components/tarot/how-to-read-content";
import { languageAlternates } from "@/lib/i18n/localized-routes";

export const metadata: Metadata = {
  alternates: languageAlternates("/tarot/how-to-read-tarot", "en"),
  title: "How to Read Tarot",
  description: "A beginner-friendly guide to reading Tarot cards: choosing a spread, shuffling with intention, and interpreting upright and reversed cards.",
};

export default function HowToReadTarotPage() {
  return <HowToReadContent />;
}
