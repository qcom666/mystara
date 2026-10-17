import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TarotCardPage } from "@/components/tarot/tarot-card-page";
import { getAllCards, getCardById } from "@/modules/tarot/domain/deck";
import { languageAlternates } from "@/lib/i18n/localized-routes";

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
    alternates: languageAlternates(`/tarot/cards/${card.id}`, "en"),
  };
}

export default async function TarotCardDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const card = getCardById(slug);
  if (!card) notFound();

  return <TarotCardPage card={card} locale="en" />;
}
