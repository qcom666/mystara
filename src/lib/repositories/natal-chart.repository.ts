import type { NatalChart } from "@/modules/astrology/domain/types";
import { prisma } from "@/lib/db";

export async function getNatalChartCredits(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { natalChartCredits: true } });
  return user?.natalChartCredits ?? 0;
}

export interface SaveNatalChartInput {
  userId: string;
  birthDate: Date;
  hasExactTime: boolean;
  birthPlace: string | null;
  latitude: number;
  longitude: number;
  timezone: string;
  chart: NatalChart;
}

/**
 * Атомарно проверяет и списывает один кредит, затем сохраняет построенную карту: транзакция нужна,
 * чтобы два одновременных запроса не прошли проверку «кредитов > 0» по одному и тому же последнему
 * кредиту. Возвращает null, если кредитов не осталось (вызывающий код превращает это в ответ API
 * в духе 402).
 */
export async function spendCreditAndSaveNatalChart(input: SaveNatalChartInput) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: input.userId }, select: { natalChartCredits: true } });
    if (!user || user.natalChartCredits <= 0) return null;

    await tx.user.update({ where: { id: input.userId }, data: { natalChartCredits: { decrement: 1 } } });

    return tx.natalChartReading.create({
      data: {
        userId: input.userId,
        birthDate: input.birthDate,
        hasExactTime: input.hasExactTime,
        birthPlace: input.birthPlace,
        latitude: input.latitude,
        longitude: input.longitude,
        timezone: input.timezone,
        chart: input.chart as object,
      },
    });
  });
}

export async function listNatalChartReadingsForUser(userId: string, limit = 10) {
  return prisma.natalChartReading.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: limit });
}

// Покупки и начисление кредитов находятся в purchase.repository.ts (fulfillPurchase).
