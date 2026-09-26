import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ReadingDetailView } from "@/components/reading/reading-detail-view";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { getReadingForUser, mapDbCardsToRecords } from "@/lib/repositories/reading.repository";
import { requireSpreadById } from "@/modules/tarot/domain/spreads.data";
import { reconstructDrawnCards } from "@/modules/tarot/services/reading.service";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Reading Detail" };

export default async function ReadingDetailPage({ params }: PageProps) {
  const session = await auth().catch(() => null);
  if (!session?.user?.id) redirect("/login");
  if (!isDatabaseConfigured()) notFound();

  const { id } = await params;
  const reading = await getReadingForUser(id, session.user.id);
  if (!reading) notFound();

  const spread = requireSpreadById(reading.spreadId);
  const records = mapDbCardsToRecords(reading.cards);
  const drawnCards = reconstructDrawnCards(spread, records);
  const interpretation = reading.aiInterpretation
    ? { overall: reading.aiInterpretation.overall, advice: reading.aiInterpretation.advice, challenges: reading.aiInterpretation.challenges }
    : null;

  return (
    <ReadingDetailView
      readingId={reading.id}
      spread={spread}
      question={reading.question}
      createdAt={reading.createdAt.toISOString()}
      isFavorite={reading.isFavorite}
      drawnCards={drawnCards}
      interpretation={interpretation}
    />
  );
}
