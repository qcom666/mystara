import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { DetailedCompatibilityContent } from "@/components/astrology/detailed-compatibility-view";
import { languageAlternates } from "@/lib/i18n/localized-routes";
import { requireZodiacSignById } from "@/modules/astrology/domain/zodiac-signs.data";
import { allCompatibilitySlugs, compatibilitySlug, parseCompatibilitySlug } from "@/modules/astrology/services/compatibility";
import { getDetailedCompatibility } from "@/modules/astrology/services/detailed-compatibility";

interface PageProps {
  params: Promise<{ pair: string }>;
}

export function generateStaticParams() {
  return allCompatibilitySlugs().map((pair) => ({ pair }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const parsed = parseCompatibilitySlug((await params).pair);
  if (!parsed) return {};
  const result = getDetailedCompatibility(...parsed, "love");
  const first = requireZodiacSignById(result.first).name;
  const second = requireZodiacSignById(result.second).name;
  return {
    title: `${first} and ${second}: Love Compatibility`,
    description: `${first} and ${second}: ${result.overall}% love compatibility. A breakdown across 12 areas — attraction, trust, communication, everyday life and more.`,
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

  return <DetailedCompatibilityContent result={getDetailedCompatibility(...parsed, "love")} />;
}
