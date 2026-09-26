import { prisma } from "@/lib/db";
import type { LifePathNumber } from "@/modules/numerology/domain/types";

export interface CreateNumerologyReadingInput {
  userId: string;
  birthDate: Date;
  lifePathNumber: LifePathNumber;
}

export async function createNumerologyReading(input: CreateNumerologyReadingInput) {
  return prisma.numerologyReading.create({
    data: { userId: input.userId, birthDate: input.birthDate, lifePathNumber: input.lifePathNumber },
  });
}

export async function listNumerologyReadingsForUser(userId: string, limit = 10) {
  return prisma.numerologyReading.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
