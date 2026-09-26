import type { Metadata } from "next";
import { HowToReadContent } from "@/components/tarot/how-to-read-content";

export const metadata: Metadata = {
  title: "How to Read Tarot",
  description: "A beginner-friendly guide to reading Tarot cards: choosing a spread, shuffling with intention, and interpreting upright and reversed cards.",
};

export default function HowToReadTarotPage() {
  return <HowToReadContent />;
}
