import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { CompatibilityPairContent } from "@/components/astrology/compatibility-pair-content";
import { requireZodiacSignById } from "@/modules/astrology/domain/zodiac-signs.data";
import { allCompatibilitySlugs, compatibilitySlug, getCompatibility, parseCompatibilitySlug } from "@/modules/astrology/services/compatibility";
import { languageAlternates } from "@/lib/i18n/localized-routes";

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
    alternates: languageAlternates(`/astrology/compatibility/${compatibilitySlug(result.first, result.second)}`, "en"),
  };
}

export default async function CompatibilityPairPage({ params }: PageProps) {
  const { pair } = await params;
  const parsed = parseCompatibilitySlug(pair);
  if (!parsed) notFound();
  // Одна страница на пару: «leo-aries» ведёт на «aries-leo».
  const canonical = compatibilitySlug(...parsed);
  if (canonical !== pair) permanentRedirect(`/astrology/compatibility/${canonical}`);

  return <CompatibilityPairContent result={getCompatibility(...parsed)} />;
}
