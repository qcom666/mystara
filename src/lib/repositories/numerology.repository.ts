import { prisma } from "@/lib/db";
import type { LifePathNumber } from "@/modules/numerology/domain/types";

/** Выражение/Душа/Личность/Зрелость в одной системе; см. NumerologyProfile. */
export interface NumerologyProfileNumbers {
  expressionNumber: LifePathNumber;
  soulUrgeNumber: LifePathNumber;
  personalityNumber: LifePathNumber;
  maturityNumber: LifePathNumber;
}

export interface CreateNumerologyReadingInput {
  userId: string;
  birthDate: Date;
  lifePathNumber: LifePathNumber;
  birthdayNumber?: LifePathNumber | null;
  fullName?: string | null;
  pythagorean?: NumerologyProfileNumbers | null;
  chaldean?: NumerologyProfileNumbers | null;
}

export async function createNumerologyReading(input: CreateNumerologyReadingInput) {
  return prisma.numerologyReading.create({
    data: {
      userId: input.userId,
      birthDate: input.birthDate,
      lifePathNumber: input.lifePathNumber,
      birthdayNumber: input.birthdayNumber ?? null,
      fullName: input.fullName ?? null,
      pythagoreanExpression: input.pythagorean?.expressionNumber ?? null,
      pythagoreanSoulUrge: input.pythagorean?.soulUrgeNumber ?? null,
      pythagoreanPersonality: input.pythagorean?.personalityNumber ?? null,
      pythagoreanMaturity: input.pythagorean?.maturityNumber ?? null,
      chaldeanExpression: input.chaldean?.expressionNumber ?? null,
      chaldeanSoulUrge: input.chaldean?.soulUrgeNumber ?? null,
      chaldeanPersonality: input.chaldean?.personalityNumber ?? null,
      chaldeanMaturity: input.chaldean?.maturityNumber ?? null,
    },
  });
}

export async function listNumerologyReadingsForUser(userId: string, limit = 10) {
  return prisma.numerologyReading.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
