import type { Prisma } from "@prisma/client";
import { hasConfiguredAdmins, isAdminAccount } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { isPremiumActive, weeklyNatalChartAllowance, type WeeklyNatalChartAllowance } from "@/modules/subscriptions/premium";

/** Клиент базы или клиент внутри транзакции: нужным запросам годится и тот и другой. */
type Db = Pick<Prisma.TransactionClient, "subscription" | "natalChartReading" | "user">;

export interface PremiumState {
  planTier: "free" | "premium";
  /** Конец оплаченного периода; null, если Premium не действует (или доступ полный, без срока). */
  currentPeriodEnd: Date | null;
  /** Можно ли построить натальную карту по подписке и когда освободится следующее построение. */
  natalChartWeekly: WeeklyNatalChartAllowance;
  /** true у администраторов: все функции доступны без оплаты, без кредитов и без недельного ограничения. */
  fullAccess: boolean;
}

/**
 * Аккаунты администраторов (ADMIN_USER_IDS / ADMIN_TELEGRAM_IDS, см. lib/admin.ts) пользуются всеми
 * функциями без оплаты. Пока администраторы не настроены, лишнего запроса к базе нет.
 */
export async function hasFullAccess(userId: string, db: Pick<Db, "user"> = prisma): Promise<boolean> {
  if (!hasConfiguredAdmins()) return false;
  const account = await db.user.findUnique({ where: { id: userId }, select: { id: true, telegramId: true } });
  return account !== null && isAdminAccount(account);
}

/**
 * Состояние подписки на момент `now`. Считается по базе при каждом обращении, а не берётся из сессии:
 * тариф меняется сразу после оплаты и перестаёт действовать по окончании срока без повторного входа.
 */
export async function getPremiumState(userId: string, now: Date = new Date(), db: Db = prisma): Promise<PremiumState> {
  if (await hasFullAccess(userId, db)) {
    return { planTier: "premium", currentPeriodEnd: null, natalChartWeekly: { available: true, nextAvailableAt: null }, fullAccess: true };
  }

  const subscription = await db.subscription.findUnique({ where: { userId } });
  const active = isPremiumActive(subscription, now);
  if (!active) {
    return { planTier: "free", currentPeriodEnd: null, natalChartWeekly: weeklyNatalChartAllowance(false, null, now), fullAccess: false };
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
    fullAccess: false,
  };
}

/** Только тариф: то, что нужно проверкам лимитов раскладов. */
export async function getPlanTier(userId: string): Promise<"free" | "premium"> {
  if (await hasFullAccess(userId)) return "premium";
  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  return isPremiumActive(subscription, new Date()) ? "premium" : "free";
}
