import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { AnotherPairHeading, CompatibilityFooterLinks, CompatibilityPicker, CompatibilityResult } from "@/components/astrology/compatibility-view";
import { GlassPanel } from "@/components/ui/glass-panel";
import { requireZodiacSignById } from "@/modules/astrology/domain/zodiac-signs.data";
import { allCompatibilitySlugs, compatibilitySlug, getCompatibility, parseCompatibilitySlug } from "@/modules/astrology/services/compatibility";

interface PageProps {
  params: Promise<{ pair: string }>;
}

export function generateStaticParams() {
  return allCompatibilitySlugs().map((pair) => ({ pair }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const parsed = parseCompatibilitySlug((await params).pair);
  if (!parsed) return {};
  const result = getCompatibility(...parsed);
  const first = requireZodiacSignById(result.first).name;
  const second = requireZodiacSignById(result.second).name;
  return {
    title: `${first} and ${second} Compatibility`,
    description: `${first} and ${second}: ${result.scores.overall}% overall. How these signs get along in love, friendship and work.`,
    alternates: { canonical: `/astrology/compatibility/${compatibilitySlug(result.first, result.second)}` },
  };
}

export default async function CompatibilityPairPage({ params }: PageProps) {
  const { pair } = await params;
  const parsed = parseCompatibilitySlug(pair);
  if (!parsed) notFound();
  // Одна страница на пару: «leo-aries» ведёт на «aries-leo».
  const canonical = compatibilitySlug(...parsed);
  if (canonical !== pair) permanentRedirect(`/astrology/compatibility/${canonical}`);

  const result = getCompatibility(...parsed);
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <CompatibilityResult result={result} />
      <GlassPanel className="mt-10">
        <AnotherPairHeading />
        <Suspense>
          <CompatibilityPicker initialFirst={result.first} initialSecond={result.second} />
        </Suspense>
      </GlassPanel>
      <CompatibilityFooterLinks />
    </div>
  );
}
