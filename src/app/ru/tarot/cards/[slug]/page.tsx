import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TarotCardPage } from "@/components/tarot/tarot-card-page";
import { localizedMetadata } from "@/lib/seo/page-metadata";
import { getAllCards, getCardById, getCardMeanings, getCardName } from "@/modules/tarot/domain/deck";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllCards().map((card) => ({ slug: card.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const card = getCardById((await params).slug);
  if (!card) return {};
  const name = getCardName(card, "ru");
  return localizedMetadata({
    path: `/tarot/cards/${card.id}`,
    locale: "ru",
    title: `${name} — значение карты Таро`,
    description: `${name}: ${getCardMeanings(card, "ru").upright}`,
  });
}

export default async function RuTarotCardPage({ params }: PageProps) {
  const card = getCardById((await params).slug);
  if (!card) notFound();
  return <TarotCardPage card={card} locale="ru" />;
}
