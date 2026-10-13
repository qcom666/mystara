import type { NatalChart } from "@/modules/astrology/domain/types";
import { prisma } from "@/lib/db";
import { getPremiumState } from "./subscription.repository";

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
 * Определяет, чем оплачивается построение, и сохраняет карту. Сначала используется недельное
 * построение по подписке Premium (если оно доступно), иначе списывается один кредит пакета. Возвращает
 * null, если нет ни того ни другого (вызывающий код превращает это в ответ API в духе 402).
 *
 * Всё выполняется в одной транзакции под блокировкой строки пользователя: без неё два одновременных
 * запроса могли бы оба увидеть свободное построение или последний кредит и воспользоваться им дважды.
 */
export async function saveNatalChartWithEntitlement(input: SaveNatalChartInput) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${input.userId} FOR UPDATE`;

    const premium = await getPremiumState(input.userId, new Date(), tx);
    let source: "premium" | "credit";
    if (premium.natalChartWeekly.available) {
      source = "premium";
    } else {
      const user = await tx.user.findUnique({ where: { id: input.userId }, select: { natalChartCredits: true } });
      if (!user || user.natalChartCredits <= 0) return null;
      await tx.user.update({ where: { id: input.userId }, data: { natalChartCredits: { decrement: 1 } } });
      source = "credit";
    }

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
        source,
      },
    });
  });
}

export async function listNatalChartReadingsForUser(userId: string, limit = 10) {
  return prisma.natalChartReading.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: limit });
}

// Покупки и начисление кредитов находятся в purchase.repository.ts (fulfillPurchase).
