import { prisma } from "@/lib/db";
import { getPremiumState } from "./subscription.repository";

/** Нужное, чтобы решить, администратор ли аккаунт (см. lib/admin.ts). */
export async function getAdminCandidate(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, select: { id: true, telegramId: true } });
}

export interface AccountReadingSummary {
  id: string;
  spreadId: string;
  question: string | null;
  createdAt: string;
  isFavorite: boolean;
  cardCount: number;
}

export interface AccountNatalChartSummary {
  id: string;
  createdAt: string;
  birthPlace: string | null;
  hasExactTime: boolean;
  /** "premium" — недельная карта по подписке, "credit" — списан кредит пакета. */
  source: string;
}

export interface AccountPurchaseSummary {
  id: string;
  product: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export interface AccountData {
  profile: {
    id: string;
    name: string | null;
    email: string | null;
    telegramUsername: string | null;
    createdAt: string;
    /** Привязан ли Telegram и есть ли вход по паролю: от этого зависит раздел «Способы входа». */
    telegramLinked: boolean;
    hasPassword: boolean;
    emailVerified: boolean;
  };
  credits: number;
  premium: {
    active: boolean;
    /** Полный доступ администратора: оплата и кредиты не нужны. */
    fullAccess: boolean;
    currentPeriodEnd: string | null;
    /** Сколько целых и неполных суток осталось до конца оплаченного срока (0, если Premium не действует). */
    daysLeft: number;
    freeChartAvailable: boolean;
    nextFreeChartAt: string | null;
  };
  purchases: AccountPurchaseSummary[];
  readings: AccountReadingSummary[];
  favoriteReadings: AccountReadingSummary[];
  natalCharts: AccountNatalChartSummary[];
  numerology: { id: string; number: number; createdAt: string; fullName: string | null }[];
  astrology: { id: string; signId: string; createdAt: string; sect: string | null }[];
  favoriteCardIds: string[];
  favoriteSpreadIds: string[];
}

const READING_SELECT = {
  id: true,
  spreadId: true,
  question: true,
  createdAt: true,
  isFavorite: true,
  _count: { select: { cards: true } },
} as const;

function toReadingSummary(reading: {
  id: string;
  spreadId: string;
  question: string | null;
  createdAt: Date;
  isFavorite: boolean;
  _count: { cards: number };
}): AccountReadingSummary {
  return {
    id: reading.id,
    spreadId: reading.spreadId,
    question: reading.question,
    createdAt: reading.createdAt.toISOString(),
    isFavorite: reading.isFavorite,
    cardCount: reading._count.cards,
  };
}

/**
 * Всё, что показывает личный кабинет, одним объектом, готовым к передаче в клиентский компонент (даты
 * строками). Возвращает null, если пользователя не существует (например, удалён, а сессия ещё жива).
 */
export async function getAccountData(userId: string): Promise<AccountData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, emailVerified: true, telegramId: true, telegramUsername: true, passwordHash: true, createdAt: true, natalChartCredits: true },
  });
  if (!user) return null;

  const [premium, purchases, readings, favoriteReadings, natalCharts, numerology, astrology, favorites] = await Promise.all([
    getPremiumState(userId),
    prisma.purchase.findMany({ where: { userId, status: { not: "failed" } }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.reading.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20, select: READING_SELECT }),
    prisma.reading.findMany({ where: { userId, isFavorite: true }, orderBy: { createdAt: "desc" }, take: 50, select: READING_SELECT }),
    prisma.natalChartReading.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, createdAt: true, birthPlace: true, hasExactTime: true, source: true },
    }),
    prisma.numerologyReading.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, lifePathNumber: true, createdAt: true, fullName: true },
    }),
    prisma.astrologyReading.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, sunSign: true, createdAt: true, sect: true },
    }),
    prisma.favorite.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, select: { type: true, targetId: true } }),
  ]);

  return {
    profile: {
      id: user.id,
      name: user.name,
      email: user.email,
      telegramUsername: user.telegramUsername,
      createdAt: user.createdAt.toISOString(),
      telegramLinked: user.telegramId !== null,
      hasPassword: user.passwordHash !== null,
      emailVerified: user.emailVerified !== null,
    },
    credits: user.natalChartCredits,
    premium: {
      active: premium.planTier === "premium",
      fullAccess: premium.fullAccess,
      currentPeriodEnd: premium.currentPeriodEnd?.toISOString() ?? null,
      daysLeft: premium.currentPeriodEnd ? Math.max(0, Math.ceil((premium.currentPeriodEnd.getTime() - Date.now()) / 86_400_000)) : 0,
      freeChartAvailable: premium.natalChartWeekly.available,
      nextFreeChartAt: premium.natalChartWeekly.nextAvailableAt?.toISOString() ?? null,
    },
    purchases: purchases.map((purchase) => ({
      id: purchase.id,
      product: purchase.product,
      amount: purchase.amount,
      currency: purchase.currency,
      status: purchase.status,
      createdAt: purchase.createdAt.toISOString(),
    })),
    readings: readings.map(toReadingSummary),
    favoriteReadings: favoriteReadings.map(toReadingSummary),
    natalCharts: natalCharts.map((chart) => ({
      id: chart.id,
      createdAt: chart.createdAt.toISOString(),
      birthPlace: chart.birthPlace,
      hasExactTime: chart.hasExactTime,
      source: chart.source,
    })),
    numerology: numerology.map((entry) => ({
      id: entry.id,
      number: entry.lifePathNumber,
      createdAt: entry.createdAt.toISOString(),
      fullName: entry.fullName,
    })),
    astrology: astrology.map((entry) => ({
      id: entry.id,
      signId: entry.sunSign,
      createdAt: entry.createdAt.toISOString(),
      sect: entry.sect,
    })),
    favoriteCardIds: favorites.filter((favorite) => favorite.type === "CARD").map((favorite) => favorite.targetId),
    favoriteSpreadIds: favorites.filter((favorite) => favorite.type === "SPREAD").map((favorite) => favorite.targetId),
  };
}

/** Сохранённая натальная карта пользователя для страницы просмотра; чужую карту получить нельзя. */
export async function getNatalChartForUser(chartId: string, userId: string) {
  return prisma.natalChartReading.findFirst({ where: { id: chartId, userId } });
}
