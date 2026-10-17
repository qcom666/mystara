import type { Metadata } from "next";
import { TarotHubContent } from "@/components/tarot/tarot-hub-content";
import { languageAlternates } from "@/lib/i18n/localized-routes";

export const metadata: Metadata = {
  alternates: languageAlternates("/tarot", "en"),
  title: "Learn Tarot",
  description: "Learn Tarot card meanings, spreads, and how to read Tarot for yourself.",
};

export default function TarotHubPage() {
  return <TarotHubContent />;
}
