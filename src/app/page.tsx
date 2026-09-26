import { AIShowcase } from "@/components/marketing/ai-showcase";
import { CardShowcase } from "@/components/marketing/card-showcase";
import { CTASection } from "@/components/marketing/cta-section";
import { FAQ } from "@/components/marketing/faq";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { InteractivePreview } from "@/components/marketing/interactive-preview";
import { PopularSpreads } from "@/components/marketing/popular-spreads";
import { TelegramGate } from "@/components/telegram/telegram-gate";

export default function Home() {
  return (
    <TelegramGate>
      <Hero />
      <InteractivePreview />
      <PopularSpreads />
      <HowItWorks />
      <CardShowcase />
      <AIShowcase />
      <FAQ />
      <CTASection />
    </TelegramGate>
  );
}
