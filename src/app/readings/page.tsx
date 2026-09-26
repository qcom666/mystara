import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ReadingsHistoryView, type ReadingsHistoryData } from "@/components/reading/readings-history-view";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { listAstrologyReadingsForUser } from "@/lib/repositories/astrology.repository";
import { listNumerologyReadingsForUser } from "@/lib/repositories/numerology.repository";
import { listReadingsForUser } from "@/lib/repositories/reading.repository";
import type { ZodiacSignId } from "@/modules/astrology/domain/types";
import type { LifePathNumber } from "@/modules/numerology/domain/types";

export const metadata: Metadata = { title: "My Readings" };

export default async function ReadingsHistoryPage() {
  const session = await auth().catch(() => null);
  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!isDatabaseConfigured()) {
    return <ReadingsHistoryView data={{ status: "unconfigured" }} />;
  }

  const [readings, numerologyReadings, astrologyReadings] = await Promise.all([
    listReadingsForUser(session.user.id),
    listNumerologyReadingsForUser(session.user.id),
    listAstrologyReadingsForUser(session.user.id),
  ]);

  const data: ReadingsHistoryData = {
    status: "ready",
    readings: readings.map((reading) => ({
      id: reading.id,
      spreadId: reading.spreadId,
      question: reading.question,
      createdAt: reading.createdAt.toISOString(),
      isFavorite: reading.isFavorite,
      cardCount: reading.cards.length,
    })),
    numerologyReadings: numerologyReadings.map((entry) => ({
      id: entry.id,
      number: entry.lifePathNumber as LifePathNumber,
      createdAt: entry.createdAt.toISOString(),
    })),
    astrologyReadings: astrologyReadings.map((entry) => ({
      id: entry.id,
      signId: entry.sunSign as ZodiacSignId,
      createdAt: entry.createdAt.toISOString(),
    })),
  };

  return <ReadingsHistoryView data={data} />;
}
