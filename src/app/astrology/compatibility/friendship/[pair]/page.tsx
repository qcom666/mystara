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
  const result = getDetailedCompatibility(...parsed, "friendship");
  const first = requireZodiacSignById(result.first).name;
  const second = requireZodiacSignById(result.second).name;
  return {
    title: `${first} and ${second}: Friendship Compatibility`,
    description: `${first} and ${second}: ${result.overall}% friendship compatibility. A breakdown across 12 areas — humour, trust, support, adventures and more.`,
    alternates: languageAlternates(`/astrology/compatibility/friendship/${compatibilitySlug(result.first, result.second)}`, "en"),
  };
}

export default async function FriendshipCompatibilityPairPage({ params }: PageProps) {
  const { pair } = await params;
  const parsed = parseCompatibilitySlug(pair);
  if (!parsed) notFound();
  // Одна страница на пару: «leo-aries» ведёт на «aries-leo».
  const canonical = compatibilitySlug(...parsed);
  if (canonical !== pair) permanentRedirect(`/astrology/compatibility/friendship/${canonical}`);

  return <DetailedCompatibilityContent result={getDetailedCompatibility(...parsed, "friendship")} />;
}
