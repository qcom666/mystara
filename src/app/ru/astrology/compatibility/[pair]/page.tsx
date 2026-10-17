import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { CompatibilityPairContent } from "@/components/astrology/compatibility-pair-content";
import { localizedMetadata } from "@/lib/seo/page-metadata";
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
  const first = requireZodiacSignById(result.first).nameRu;
  const second = requireZodiacSignById(result.second).nameRu;
  return localizedMetadata({
    path: `/astrology/compatibility/${compatibilitySlug(result.first, result.second)}`,
    locale: "ru",
    title: `${first} и ${second}: совместимость`,
    description: `${first} и ${second}: ${result.scores.overall}% в целом. Как эти знаки ладят в любви, дружбе и работе.`,
  });
}

export default async function RuCompatibilityPairPage({ params }: PageProps) {
  const { pair } = await params;
  const parsed = parseCompatibilitySlug(pair);
  if (!parsed) notFound();
  // Одна страница на пару: «leo-aries» ведёт на «aries-leo».
  const canonical = compatibilitySlug(...parsed);
  if (canonical !== pair) permanentRedirect(`/ru/astrology/compatibility/${canonical}`);
  return <CompatibilityPairContent result={getCompatibility(...parsed)} />;
}
