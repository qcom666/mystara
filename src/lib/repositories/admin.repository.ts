import { prisma } from "@/lib/db";
import { extendPremiumPeriodEnd } from "@/modules/subscriptions/premium";

const DAY_MS = 86_400_000;

export async function getDashboardStats(now: Date = new Date()) {
  const week = new Date(now.getTime() - 7 * DAY_MS);
  const month = new Date(now.getTime() - 30 * DAY_MS);

  const [users, newUsers, telegramUsers, premiumActive, paidByProduct, pending, natalCharts30, readings30, recentPurchases, recentUsers] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: week } } }),
      prisma.user.count({ where: { telegramId: { not: null } } }),
      prisma.subscription.count({ where: { tier: "PREMIUM", status: "ACTIVE", currentPeriodEnd: { gt: now } } }),
      prisma.purchase.groupBy({ by: ["product", "currency"], where: { status: "paid" }, _sum: { amount: true }, _count: { _all: true } }),
      prisma.purchase.count({ where: { status: "pending", createdAt: { lt: new Date(now.getTime() - 60 * 60 * 1000) } } }),
      prisma.natalChartReading.count({ where: { createdAt: { gte: month } } }),
      prisma.reading.count({ where: { createdAt: { gte: month } } }),
      prisma.purchase.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { user: { select: { id: true, email: true, name: true, telegramUsername: true } } } }),
      prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 10, select: { id: true, email: true, name: true, telegramUsername: true, createdAt: true } }),
    ]);

  return {
    users,
    newUsers,
    telegramUsers,
    premiumActive,
    paidByProduct: paidByProduct.map((row) => ({
      product: row.product,
      currency: row.currency,
      count: row._count._all,
      sum: row._sum.amount ?? 0,
    })),
    stalePending: pending,
    natalCharts30,
    readings30,
    recentPurchases,
    recentUsers,
  };
}

export async function searchUsers(query: string, take = 50) {
  const q = query.trim();
  const where = q
    ? {
        OR: [
          { id: q },
          { telegramId: q },
          { email: { contains: q, mode: "insensitive" as const } },
          { name: { contains: q, mode: "insensitive" as const } },
          { telegramUsername: { contains: q.replace(/^@/, ""), mode: "insensitive" as const } },
        ],
      }
    : {};
  return prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      email: true,
      name: true,
      telegramUsername: true,
      createdAt: true,
      natalChartCredits: true,
      subscription: { select: { tier: true, status: true, currentPeriodEnd: true } },
    },
  });
}

export async function getUserDetail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      telegramId: true,
      telegramUsername: true,
      createdAt: true,
      natalChartCredits: true,
      privacyConsentAt: true,
      privacyPolicyVersion: true,
      subscription: true,
      _count: { select: { readings: true, natalChartReadings: true, favorites: true } },
    },
  });
  if (!user) return null;

  const [purchases, natalCharts, actions] = await Promise.all([
    prisma.purchase.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.natalChartReading.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, createdAt: true, birthPlace: true, source: true },
    }),
    prisma.adminAction.findMany({ where: { targetUserId: userId }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  return { user, purchases, natalCharts, actions };
}

export async function listPurchases(options: { status?: string; take?: number }) {
  return prisma.purchase.findMany({
    where: options.status ? { status: options.status } : {},
    orderBy: { createdAt: "desc" },
    take: options.take ?? 100,
    include: { user: { select: { id: true, email: true, name: true, telegramUsername: true } } },
  });
}

export type AdminActionResult<T> = { ok: true; value: T } | { ok: false; error: "not_found" | "negative_balance" };

/**
 * Ручная корректировка кредитов (положительная или отрицательная, например после возврата платежа).
 * Баланс не может стать отрицательным. Изменение и запись в журнал делаются в одной транзакции под
 * блокировкой строки пользователя.
 */
export async function adjustCredits(input: { adminId: string; userId: string; delta: number; reason: string }): Promise<AdminActionResult<{ before: number; after: number }>> {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${input.userId} FOR UPDATE`;
    const user = await tx.user.findUnique({ where: { id: input.userId }, select: { natalChartCredits: true } });
    if (!user) return { ok: false, error: "not_found" } as const;

    const before = user.natalChartCredits;
    const after = before + input.delta;
    if (after < 0) return { ok: false, error: "negative_balance" } as const;

    await tx.user.update({ where: { id: input.userId }, data: { natalChartCredits: after } });
    await tx.adminAction.create({
      data: {
        adminId: input.adminId,
        targetUserId: input.userId,
        action: "credits.adjust",
        details: { delta: input.delta, before, after, reason: input.reason },
      },
    });
    return { ok: true, value: { before, after } } as const;
  });
}

/** Продлевает Premium вручную на указанное число дней (по тем же правилам, что и оплата). */
export async function extendPremiumByAdmin(input: { adminId: string; userId: string; days: number; reason: string }): Promise<AdminActionResult<{ before: Date | null; after: Date }>> {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${input.userId} FOR UPDATE`;
    const user = await tx.user.findUnique({ where: { id: input.userId }, select: { id: true } });
    if (!user) return { ok: false, error: "not_found" } as const;

    const existing = await tx.subscription.findUnique({ where: { userId: input.userId } });
    const before = existing?.currentPeriodEnd ?? null;
    const after = extendPremiumPeriodEnd(before, new Date(), input.days);
    const data = { tier: "PREMIUM" as const, status: "ACTIVE" as const, provider: "admin", externalId: null, currentPeriodEnd: after };
    await tx.subscription.upsert({ where: { userId: input.userId }, create: { userId: input.userId, ...data }, update: data });
    await tx.adminAction.create({
      data: {
        adminId: input.adminId,
        targetUserId: input.userId,
        action: "premium.extend",
        details: { days: input.days, before: before?.toISOString() ?? null, after: after.toISOString(), reason: input.reason },
      },
    });
    return { ok: true, value: { before, after } } as const;
  });
}

/** Немедленно прекращает Premium (например, после возврата платежа): срок обрезается до текущего момента. */
export async function endPremiumByAdmin(input: { adminId: string; userId: string; reason: string }): Promise<AdminActionResult<{ before: Date | null }>> {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${input.userId} FOR UPDATE`;
    const existing = await tx.subscription.findUnique({ where: { userId: input.userId } });
    if (!existing) return { ok: false, error: "not_found" } as const;

    const now = new Date();
    await tx.subscription.update({ where: { userId: input.userId }, data: { status: "CANCELED", currentPeriodEnd: now } });
    await tx.adminAction.create({
      data: {
        adminId: input.adminId,
        targetUserId: input.userId,
        action: "premium.end",
        details: { before: existing.currentPeriodEnd?.toISOString() ?? null, after: now.toISOString(), reason: input.reason },
      },
    });
    return { ok: true, value: { before: existing.currentPeriodEnd } } as const;
  });
}
