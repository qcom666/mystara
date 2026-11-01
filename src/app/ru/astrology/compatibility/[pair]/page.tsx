import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { DetailedCompatibilityContent } from "@/components/astrology/detailed-compatibility-view";
import { localizedMetadata } from "@/lib/seo/page-metadata";
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
  const first = requireZodiacSignById(result.first).nameRu;
  const second = requireZodiacSignById(result.second).nameRu;
  return localizedMetadata({
    path: `/astrology/compatibility/${compatibilitySlug(result.first, result.second)}`,
    locale: "ru",
    title: `${first} и ${second}: совместимость в любви`,
    description: `${first} и ${second}: совместимость в любви ${result.overall}%. Разбор по 12 пунктам — притяжение, доверие, общение, быт и другое.`,
  });
}

export default async function RuCompatibilityPairPage({ params }: PageProps) {
  const { pair } = await params;
  const parsed = parseCompatibilitySlug(pair);
  if (!parsed) notFound();
  // Одна страница на пару: «leo-aries» ведёт на «aries-leo».
  const canonical = compatibilitySlug(...parsed);
  if (canonical !== pair) permanentRedirect(`/ru/astrology/compatibility/${canonical}`);
  return <DetailedCompatibilityContent result={getDetailedCompatibility(...parsed, "love")} />;
}
