import type { Metadata } from "next";
import { AIShowcase } from "@/components/marketing/ai-showcase";
import { CardShowcase } from "@/components/marketing/card-showcase";
import { CTASection } from "@/components/marketing/cta-section";
import { FAQ } from "@/components/marketing/faq";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { InteractivePreview } from "@/components/marketing/interactive-preview";
import { PopularSpreads } from "@/components/marketing/popular-spreads";
import { LandingMotion } from "@/components/motion/landing-motion";
import { TrackOnMount } from "@/components/shared/track-on-mount";
import { TelegramGate } from "@/components/telegram/telegram-gate";
import { languageAlternates } from "@/lib/i18n/localized-routes";

export const metadata: Metadata = {
  alternates: languageAlternates("/", "en"),
};

export default function Home() {
  return (
    <TelegramGate>
      <TrackOnMount event={{ name: "landing_viewed" }} />
      <LandingMotion>
        <Hero />
        <InteractivePreview />
        <PopularSpreads />
        <HowItWorks />
        <CardShowcase />
        <AIShowcase />
        <FAQ />
        <CTASection />
      </LandingMotion>
    </TelegramGate>
  );
}
