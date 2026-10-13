import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isPremiumActive, weeklyNatalChartAllowance, type WeeklyNatalChartAllowance } from "@/modules/subscriptions/premium";

/** Клиент базы или клиент внутри транзакции: нужным запросам годится и тот и другой. */
type Db = Pick<Prisma.TransactionClient, "subscription" | "natalChartReading">;

export interface PremiumState {
  planTier: "free" | "premium";
  /** Конец оплаченного периода; null, если Premium не действует. */
  currentPeriodEnd: Date | null;
  /** Можно ли построить натальную карту по подписке и когда освободится следующее построение. */
  natalChartWeekly: WeeklyNatalChartAllowance;
}

/**
 * Состояние подписки на момент `now`. Считается по базе при каждом обращении, а не берётся из сессии:
 * тариф меняется сразу после оплаты и перестаёт действовать по окончании срока без повторного входа.
 */
export async function getPremiumState(userId: string, now: Date = new Date(), db: Db = prisma): Promise<PremiumState> {
  const subscription = await db.subscription.findUnique({ where: { userId } });
  const active = isPremiumActive(subscription, now);
  if (!active) {
    return { planTier: "free", currentPeriodEnd: null, natalChartWeekly: weeklyNatalChartAllowance(false, null, now) };
  }

  const lastPremiumChart = await db.natalChartReading.findFirst({
    where: { userId, source: "premium" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  return {
    planTier: "premium",
    currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
    natalChartWeekly: weeklyNatalChartAllowance(true, lastPremiumChart?.createdAt ?? null, now),
  };
}

/** Только тариф: то, что нужно проверкам лимитов раскладов. */
export async function getPlanTier(userId: string): Promise<"free" | "premium"> {
  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  return isPremiumActive(subscription, new Date()) ? "premium" : "free";
}
