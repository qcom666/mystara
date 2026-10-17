import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { AIInterpretationResult } from "@/modules/ai/types";
import type { Orientation, ReadingCardRecord } from "@/modules/tarot/domain/types";
import { moscowDay } from "@/modules/tarot/services/daily-card";

function toDbOrientation(orientation: Orientation): "UPRIGHT" | "REVERSED" {
  return orientation === "upright" ? "UPRIGHT" : "REVERSED";
}

function fromDbOrientation(orientation: string): Orientation {
  return orientation === "UPRIGHT" ? "upright" : "reversed";
}

export interface CreateReadingInput {
  userId: string;
  spreadId: string;
  question?: string | null;
  seed: string;
  cards: ReadingCardRecord[];
}

export async function createReading(input: CreateReadingInput) {
  return prisma.reading.create({
    data: {
      userId: input.userId,
      spreadId: input.spreadId,
      question: input.question ?? null,
      seed: input.seed,
      cards: {
        create: input.cards.map((card) => ({
          cardId: card.cardId,
          positionId: card.positionId,
          orientation: toDbOrientation(card.orientation),
          order: card.order,
        })),
      },
    },
    include: { cards: true },
  });
}

/** Сколько раскладов пользователь сохранил за текущие сутки по Москве (как и остальные «дневные» функции). */
export async function countReadingsToday(userId: string, now: Date = new Date()): Promise<number> {
  const startOfDay = new Date(`${moscowDay(now)}T00:00:00+03:00`);
  return prisma.reading.count({ where: { userId, createdAt: { gte: startOfDay } } });
}

export async function listReadingsForUser(userId: string, options?: { limit?: number; cursor?: string }) {
  return prisma.reading.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 20,
    ...(options?.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
    include: { cards: true, aiInterpretation: true },
  });
}

export async function getReadingForUser(readingId: string, userId: string) {
  return prisma.reading.findFirst({
    where: { id: readingId, userId },
    include: { cards: true, aiInterpretation: true },
  });
}

export async function setReadingFavorite(readingId: string, userId: string, isFavorite: boolean): Promise<boolean> {
  const result = await prisma.reading.updateMany({ where: { id: readingId, userId }, data: { isFavorite } });
  return result.count > 0;
}

export async function saveAIInterpretation(readingId: string, result: AIInterpretationResult) {
  const cardInterpretations = result.cardInterpretations as unknown as Prisma.InputJsonValue;
  return prisma.aIInterpretation.upsert({
    where: { readingId },
    create: {
      readingId,
      provider: result.provider,
      summary: result.summary,
      overall: result.overall,
      themes: result.themes,
      advice: result.advice,
      challenges: result.challenges,
      cardInterpretations,
      generatedAt: new Date(result.generatedAt),
    },
    update: {
      provider: result.provider,
      summary: result.summary,
      overall: result.overall,
      themes: result.themes,
      advice: result.advice,
      challenges: result.challenges,
      cardInterpretations,
      generatedAt: new Date(result.generatedAt),
    },
  });
}

export function mapDbCardsToRecords(
  cards: readonly { cardId: string; positionId: string; orientation: string; order: number }[],
): ReadingCardRecord[] {
  return cards.map((card) => ({
    cardId: card.cardId,
    positionId: card.positionId,
    orientation: fromDbOrientation(card.orientation),
    order: card.order,
  }));
}
