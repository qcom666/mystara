import type { Metadata } from "next";
import { TarotHubContent } from "@/components/tarot/tarot-hub-content";

export const metadata: Metadata = {
  title: "Learn Tarot",
  description: "Learn Tarot card meanings, spreads, and how to read Tarot for yourself.",
};

export default function TarotHubPage() {
  return <TarotHubContent />;
}
