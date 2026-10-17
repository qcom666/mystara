import { prisma } from "@/lib/db";
import type { StarSubscriptionState } from "@/lib/telegram/payments";

/**
 * Подписки Premium Звёздами с автопродлением (модель StarSubscription). Списания по ним выдаёт fulfillPayment в
 * purchase.repository.ts; здесь — состояние продления: отмена, возобновление, неудачное списание.
 */

/** Кто отключил продление: пользователь в Telegram или бот (кнопка в кабинете, возврат, удаление аккаунта). */
export type CanceledBy = "user" | "bot";

/** Подписка для показа в кабинете и на странице тарифов: продлевается ли и когда следующее списание. */
export interface AutoRenewView {
  state: StarSubscriptionState;
  /** Конец оплаченного периода у Telegram: при включённом продлении в этот момент пройдёт следующее списание. */
  expiresAt: Date;
  amount: number;
  /** Можно ли отключить продление кнопкой: известен Telegram ID плательщика. */
  cancelable: boolean;
}

/**
 * Подписка пользователя, о которой стоит рассказать: продлевающаяся, а если таких нет — последняя, чей оплаченный
 * срок ещё не кончился (отключённая или с неудавшимся списанием). null, если подписок нет.
 */
export async function getAutoRenewView(userId: string, now: Date = new Date()): Promise<AutoRenewView | null> {
  const rows = await prisma.starSubscription.findMany({
    where: { userId, OR: [{ state: "active" }, { expiresAt: { gt: now } }] },
    orderBy: { expiresAt: "desc" },
    take: 5,
    select: { state: true, expiresAt: true, telegramUserId: true, purchase: { select: { amount: true } } },
  });
  const row = rows.find((candidate) => candidate.state === "active") ?? rows[0];
  if (!row) return null;
  return {
    state: row.state as StarSubscriptionState,
    expiresAt: row.expiresAt,
    amount: row.purchase.amount,
    cancelable: row.state === "active" && row.telegramUserId !== "",
  };
}

/** Есть ли у пользователя подписка, которая продлевается: тогда вторую оформить нельзя. */
export async function hasActiveStarSubscription(userId: string): Promise<boolean> {
  return (await prisma.starSubscription.count({ where: { userId, state: "active" } })) > 0;
}

/** Продлевающиеся подписки пользователя: для отключения продления. */
export async function listActiveStarSubscriptions(userId: string) {
  return prisma.starSubscription.findMany({
    where: { userId, state: "active" },
    select: { purchaseId: true, chargeId: true, telegramUserId: true },
  });
}

/** Подписка, к которой относится покупка: исходная (первая оплата) или повторное списание. */
export async function findStarSubscriptionForPurchase(purchaseId: string) {
  const purchase = await prisma.purchase.findUnique({ where: { id: purchaseId }, select: { id: true, renewalOfId: true } });
  if (!purchase) return null;
  return prisma.starSubscription.findUnique({
    where: { purchaseId: purchase.renewalOfId ?? purchase.id },
    select: { purchaseId: true, chargeId: true, telegramUserId: true, state: true },
  });
}

/**
 * Новое состояние подписки по сообщению Telegram (обновление `subscription`) или по действию бота. Если Telegram
 * сообщает о подписке другого пользователя Telegram, ничего не меняется. Возвращает, что нужно для сообщения
 * пользователю, или null, если подписки нет.
 */
export async function setStarSubscriptionState(
  purchaseId: string,
  state: StarSubscriptionState,
  options: { canceledBy?: CanceledBy; telegramUserId?: string | null } = {},
) {
  const subscription = await prisma.starSubscription.findUnique({ where: { purchaseId }, select: { telegramUserId: true } });
  if (!subscription) return null;
  if (options.telegramUserId && subscription.telegramUserId && subscription.telegramUserId !== options.telegramUserId) return null;
  return prisma.starSubscription.update({
    where: { purchaseId },
    data: {
      state,
      canceledBy: state === "canceled" ? (options.canceledBy ?? "user") : null,
      // Telegram ID плательщика мог быть неизвестен (подписка найдена сверкой без него): берём из сообщения.
      ...(options.telegramUserId && !subscription.telegramUserId ? { telegramUserId: options.telegramUserId } : {}),
    },
    select: {
      state: true,
      expiresAt: true,
      user: { select: { telegramId: true, language: true, subscription: { select: { currentPeriodEnd: true } } } },
    },
  });
}

/**
 * Подписки, у которых срок у Telegram прошёл в окне сверки (`since`..`now`): к этому времени должно было пройти
 * очередное списание. Если вебхук о нём не дошёл, срок так и остался прежним, и сверка найдёт списание в истории.
 */
export async function listStarSubscriptionsDue(options: { since: Date; now: Date; take: number; userId?: string }) {
  return prisma.starSubscription.findMany({
    where: {
      expiresAt: { gte: options.since, lte: options.now },
      state: { not: "canceled" },
      ...(options.userId ? { userId: options.userId } : {}),
    },
    orderBy: { expiresAt: "asc" },
    take: options.take,
    select: { purchaseId: true },
  });
}

/** Есть ли у пользователя подписка, списание по которой уже должно было пройти: для сверки при открытии страниц. */
export async function hasStarSubscriptionDue(userId: string, since: Date, now: Date): Promise<boolean> {
  return (await listStarSubscriptionsDue({ since, now, take: 1, userId })).length > 0;
}
