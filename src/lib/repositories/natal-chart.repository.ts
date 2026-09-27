import type { NatalChart } from "@/modules/astrology/domain/types";
import { prisma } from "@/lib/db";
import { NATAL_CHART_PACK_CREDITS } from "@/lib/pricing/natal-chart-pricing";

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
 * Atomically checks and spends one credit, then stores the generated chart —
 * a transaction so two concurrent requests can't both pass a "credits > 0"
 * check against the same last credit. Returns null if there were no credits
 * left (the caller turns that into a 402-style API response).
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

/**
 * Records a completed purchase and grants its credits. Called from a payment
 * webhook once a real provider exists (see TODO.md "Natal Chart") — not
 * called from anywhere yet, since there is no such webhook today.
 */
export async function recordPaidNatalChartPurchase(input: {
  userId: string;
  amount: number;
  currency: "RUB" | "USD";
  provider: string;
  externalId: string;
}) {
  return prisma.$transaction([
    prisma.natalChartPurchase.create({
      data: {
        userId: input.userId,
        creditsGranted: NATAL_CHART_PACK_CREDITS,
        amount: input.amount,
        currency: input.currency,
        provider: input.provider,
        externalId: input.externalId,
        status: "paid",
      },
    }),
    prisma.user.update({ where: { id: input.userId }, data: { natalChartCredits: { increment: NATAL_CHART_PACK_CREDITS } } }),
  ]);
}
