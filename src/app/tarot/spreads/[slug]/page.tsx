import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TarotSpreadDetailView } from "@/components/tarot/tarot-spread-detail-view";
import { getAllSpreads, getSpreadById } from "@/modules/tarot/domain/spreads.data";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllSpreads().map((spread) => ({ slug: spread.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const spread = getSpreadById(slug);
  if (!spread) return {};
  return { title: `${spread.name} Tarot Spread`, description: spread.description };
}

export default async function TarotSpreadDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const spread = getSpreadById(slug);
  if (!spread) notFound();

  return <TarotSpreadDetailView spread={spread} />;
}
