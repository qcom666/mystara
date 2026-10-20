import type { Metadata } from "next";
import { DailyCardContent } from "@/components/tarot/daily-card-content";
import { languageAlternates } from "@/lib/i18n/localized-routes";

export const metadata: Metadata = {
  alternates: languageAlternates("/tarot/card-of-the-day", "en"),
  title: "Tarot Card of the Day",
  description: "Reveal your free Tarot card of the day: one card every 24 hours with its meaning for love, work and the soul.",
};

export default function CardOfTheDayPage() {
  return <DailyCardContent botUsername={process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? ""} />;
}
