import type { Metadata } from "next";
import { Suspense } from "react";
import { CompatibilityFooterLinks, CompatibilityIntro, CompatibilityPicker } from "@/components/astrology/compatibility-view";
import { GlassPanel } from "@/components/ui/glass-panel";
import { languageAlternates } from "@/lib/i18n/localized-routes";

export const metadata: Metadata = {
  alternates: languageAlternates("/astrology/compatibility", "en"),
  title: "Zodiac Compatibility",
  description: "Check how two zodiac signs get along in love, friendship and work.",
};

export default function CompatibilityPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <CompatibilityIntro />
      <GlassPanel className="mt-8">
        {/* Suspense нужен из-за useSearchParams: остальная страница собирается статически. */}
        <Suspense>
          <CompatibilityPicker />
        </Suspense>
      </GlassPanel>
      <CompatibilityFooterLinks />
    </div>
  );
}
