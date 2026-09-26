import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TarotCardDetailView } from "@/components/tarot/tarot-card-detail-view";
import { getAllCards, getCardById } from "@/modules/tarot/domain/deck";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllCards().map((card) => ({ slug: card.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const card = getCardById(slug);
  if (!card) return {};
  return {
    title: `${card.name} — Tarot Card Meaning`,
    description: `${card.name}: ${card.meanings.upright}`,
  };
}

export default async function TarotCardDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const card = getCardById(slug);
  if (!card) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Thing",
    name: card.name,
    description: card.description,
  };

  return (
    <>
      <TarotCardDetailView card={card} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
