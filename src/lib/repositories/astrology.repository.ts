import { prisma } from "@/lib/db";
import type { ZodiacSignId } from "@/modules/astrology/domain/types";

export interface CreateAstrologyReadingInput {
  userId: string;
  birthDate: Date;
  sunSign: ZodiacSignId;
}

export async function createAstrologyReading(input: CreateAstrologyReadingInput) {
  return prisma.astrologyReading.create({
    data: { userId: input.userId, birthDate: input.birthDate, sunSign: input.sunSign },
  });
}

export async function listAstrologyReadingsForUser(userId: string, limit = 10) {
  return prisma.astrologyReading.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
