import { prisma } from "@/lib/db";
import type { PaymentCurrency, PaymentProductId, PaymentProviderId } from "@/lib/payments/catalog";
import { NATAL_CHART_PACK_CREDITS } from "@/lib/pricing/natal-chart-pricing";
import type { Prisma, Purchase } from "@prisma/client";
import {
  estimateSubscriptionExpiration,
  extendPremiumPeriodEnd,
  isPremiumActive,
  PREMIUM_PERIOD_DAYS,
  premiumEndAfterSubscriptionCharge,
} from "@/modules/subscriptions/premium";
import { revokeReferralRewardForRefund, rewardReferrerOnFirstPayment } from "./referral.repository";

/**
 * Создаёт покупку в статусе pending. У каждого провайдера своя цена (lib/payments/catalog.ts); пакет
 * натальных карт при оплате начисляет кредиты, период Premium — продлевает подписку. `autoRenew` — счёт
 * подписки Звёздами с автопродлением: эта покупка становится первой оплатой подписки.
 */
export async function createPendingPurchase(input: {
  userId: string;
  product: PaymentProductId;
  provider: PaymentProviderId;
  amount: number;
  currency: PaymentCurrency;
  autoRenew?: boolean;
}) {
  return prisma.purchase.create({
    data: {
      userId: input.userId,
      product: input.product,
      creditsGranted: input.product === "natal_pack" ? NATAL_CHART_PACK_CREDITS : 0,
      amount: input.amount,
      currency: input.currency,
      provider: input.provider,
      status: "pending",
      autoRenew: input.autoRenew === true,
    },
  });
}

export async function markPurchaseFailed(purchaseId: string): Promise<void> {
  await prisma.purchase.updateMany({ where: { id: purchaseId, status: "pending" }, data: { status: "failed" } });
}

/**
 * Запоминает идентификатор платежа у провайдера, пока покупка ждёт оплаты: по нему сайт сам спрашивает
 * у ЮKassa статус и выдаёт оплаченное, даже если уведомление задержалось или не пришло.
 */
export async function attachProviderPaymentId(purchaseId: string, externalId: string): Promise<void> {
  await prisma.purchase.updateMany({ where: { id: purchaseId, status: "pending" }, data: { externalId } });
}

/**
 * Неоплаченные покупки провайдера, созданные после `since`: их статус сверяется с провайдером. Для ЮKassa
 * нужен сохранённый id платежа (`withPaymentId`), у Звёзд платёж ищется по id покупки в истории бота.
 */
export async function listPendingPurchases(options: {
  provider: PaymentProviderId;
  since: Date;
  take: number;
  userId?: string;
  purchaseId?: string;
  withPaymentId?: boolean;
}) {
  return prisma.purchase.findMany({
    where: {
      provider: options.provider,
      status: "pending",
      createdAt: { gte: options.since },
      ...(options.withPaymentId ? { externalId: { not: null } } : {}),
      ...(options.userId ? { userId: options.userId } : {}),
      ...(options.purchaseId ? { id: options.purchaseId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: options.take,
    select: { id: true, externalId: true, amount: true },
  });
}

/**
 * Закрывает как неудавшиеся покупки, которые так и не оплатили за `olderThan`: брошенные счета. Если
 * провайдер всё же подтвердит оплату такой покупки, она будет выдана (см. fulfillPurchase).
 */
export async function expireStalePendingPurchases(olderThan: Date): Promise<number> {
  const result = await prisma.purchase.updateMany({ where: { status: "pending", createdAt: { lt: olderThan } }, data: { status: "failed" } });
  return result.count;
}

/** Какие из списаний провайдера уже записаны покупками: сверка выдаёт только остальные. */
export async function findRecordedExternalIds(provider: PaymentProviderId, externalIds: string[]): Promise<Set<string>> {
  if (externalIds.length === 0) return new Set();
  const rows = await prisma.purchase.findMany({ where: { provider, externalId: { in: externalIds } }, select: { externalId: true } });
  return new Set(rows.flatMap((row) => (row.externalId ? [row.externalId] : [])));
}

/** Статус своей покупки (для экрана «подтверждаем оплату»); null, если покупки нет или она чужая. */
export async function getPurchaseStatusForUser(purchaseId: string, userId: string) {
  return prisma.purchase.findFirst({ where: { id: purchaseId, userId }, select: { status: true, product: true, provider: true } });
}

/** Что нужно для сообщения покупателю после оплаты: товар, его Telegram и выданное. */
export async function getFulfilledPurchaseSummary(purchaseId: string) {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    select: {
      product: true,
      creditsGranted: true,
      autoRenew: true,
      renewalOfId: true,
      starSubscription: { select: { state: true, expiresAt: true } },
      renewalOf: { select: { starSubscription: { select: { state: true, expiresAt: true } } } },
      user: { select: { telegramId: true, language: true, natalChartCredits: true, subscription: { select: { currentPeriodEnd: true } } } },
    },
  });
  if (!purchase) return null;
  const starSubscription = purchase.starSubscription ?? purchase.renewalOf?.starSubscription ?? null;
  return {
    product: purchase.product,
    creditsGranted: purchase.creditsGranted,
    telegramId: purchase.user.telegramId,
    language: purchase.user.language,
    credits: purchase.user.natalChartCredits,
    premiumUntil: purchase.user.subscription?.currentPeriodEnd ?? null,
    // Следующее списание по подписке (если продление включено): о нём сообщение покупателю говорит отдельно.
    renewal: purchase.renewalOfId !== null,
    nextChargeAt: starSubscription?.state === "active" ? starSubscription.expiresAt : null,
  };
}

export interface PaidPayment {
  purchaseId: string;
  provider: PaymentProviderId;
  /** Собственный идентификатор транзакции у провайдера (id платежа Stars, id платежа ЮKassa). */
  externalId: string;
  /** Что провайдер сообщает о реальной оплате: сверяется с тем, что мы запрашивали. */
  amount: number;
  currency: PaymentCurrency;
  /** Только для подписки Звёздами: когда прошло списание, до какого числа оно продлило подписку и кто платил. */
  subscription?: SubscriptionCharge;
}

export interface SubscriptionCharge {
  chargedAt: Date;
  /** subscription_expiration_date из successful_payment; null, если неизвестен (оплата найдена сверкой). */
  expiresAt: Date | null;
  /** Telegram ID плательщика: подписку отключают от его имени. */
  telegramUserId: string | null;
}

export type FulfillResult = "fulfilled" | "already_paid" | "not_found" | "mismatch";

export interface FulfillOutcome {
  result: FulfillResult;
  /** Покупка, которой соответствует платёж: исходная или запись повторного списания по подписке. */
  purchaseId: string;
}

type Tx = Prisma.TransactionClient;

/** Блокировка строки пользователя: две одновременные оплаты не должны прочитать один и тот же конец периода. */
async function lockUser(tx: Tx, userId: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
}

async function setPremiumPeriodEnd(tx: Tx, userId: string, payment: PaidPayment, currentPeriodEnd: Date): Promise<void> {
  const data = { tier: "PREMIUM" as const, status: "ACTIVE" as const, provider: payment.provider, externalId: payment.externalId, currentPeriodEnd };
  await tx.subscription.upsert({ where: { userId }, create: { userId, ...data }, update: data });
}

/**
 * Списание по подписке Звёздами с автопродлением. Первое списание делает оплаченной исходную покупку, каждое
 * следующее записывается отдельной покупкой со ссылкой на неё (новая строка на каждый telegram_payment_charge_id),
 * поэтому одно и то же списание, пришедшее вебхуком и найденное сверкой, выдаётся один раз. Срок Premium
 * выставляется по сроку подписки у Telegram (premiumEndAfterSubscriptionCharge).
 */
async function fulfillSubscriptionCharge(tx: Tx, purchase: Purchase, payment: PaidPayment): Promise<FulfillOutcome> {
  if (purchase.product !== "premium_month" || payment.provider !== "stars") return { result: "mismatch", purchaseId: purchase.id };
  await lockUser(tx, purchase.userId);

  // После блокировки: параллельная доставка того же списания уже записала его и завершилась.
  const recorded = await tx.purchase.findFirst({ where: { provider: "stars", externalId: payment.externalId }, select: { id: true } });
  if (recorded) return { result: "already_paid", purchaseId: recorded.id };

  const now = new Date();
  const chargedAt = payment.subscription?.chargedAt ?? now;
  const starSubscription = await tx.starSubscription.findUnique({ where: { purchaseId: purchase.id } });

  let chargePurchaseId = purchase.id;
  if (purchase.status === "pending" || purchase.status === "failed") {
    const flipped = await tx.purchase.updateMany({
      where: { id: purchase.id, status: { in: ["pending", "failed"] } },
      data: { status: "paid", externalId: payment.externalId },
    });
    if (flipped.count === 0) return { result: "already_paid", purchaseId: purchase.id };
  } else {
    const renewal = await tx.purchase.create({
      data: {
        userId: purchase.userId,
        product: purchase.product,
        creditsGranted: 0,
        amount: payment.amount,
        currency: payment.currency,
        provider: "stars",
        externalId: payment.externalId,
        status: "paid",
        renewalOfId: purchase.id,
      },
      select: { id: true },
    });
    chargePurchaseId = renewal.id;
  }

  const previousExpiration = starSubscription?.expiresAt ?? null;
  const expiresAt = payment.subscription?.expiresAt ?? estimateSubscriptionExpiration(previousExpiration, chargedAt);
  const existing = await tx.subscription.findUnique({ where: { userId: purchase.userId } });
  const currentPeriodEnd = premiumEndAfterSubscriptionCharge({
    currentPeriodEnd: isPremiumActive(existing, now) ? (existing?.currentPeriodEnd ?? null) : null,
    previousExpiration,
    expiresAt,
    now,
  });
  await setPremiumPeriodEnd(tx, purchase.userId, payment, currentPeriodEnd);

  if (starSubscription) {
    await tx.starSubscription.update({
      where: { purchaseId: purchase.id },
      data: {
        expiresAt: previousExpiration && previousExpiration > expiresAt ? previousExpiration : expiresAt,
        // Списание новее последней смены состояния: значит, подписка снова продлевается (её возобновили или
        // повторили неудавшееся списание). Списание, найденное сверкой уже после отмены, отмену не снимает.
        ...(chargedAt > starSubscription.updatedAt ? { state: "active", canceledBy: null } : {}),
      },
    });
  } else {
    const owner = await tx.user.findUnique({ where: { id: purchase.userId }, select: { telegramId: true } });
    await tx.starSubscription.create({
      data: {
        purchaseId: purchase.id,
        userId: purchase.userId,
        chargeId: payment.externalId,
        telegramUserId: payment.subscription?.telegramUserId ?? owner?.telegramId ?? "",
        expiresAt,
      },
    });
  }

  await rewardReferrerOnFirstPayment(tx, purchase.userId, chargePurchaseId);
  return { result: "fulfilled", purchaseId: chargePurchaseId };
}

/**
 * Превращает подтверждённый платёж в то, что оплачено, ровно один раз: кредиты (пакет натальных карт)
 * или продление Premium. Смена статуса (pending → paid) и выдача выполняются в одной транзакции, а
 * сама смена — условное обновление, поэтому провайдер, доставивший то же уведомление дважды (или два
 * уведомления одновременно), не выдаст оплаченное дважды.
 *
 * Покупка, которую мы успели закрыть как неудавшуюся (брошенный счёт, отмена), тоже выдаётся, если
 * провайдер подтвердил реальную оплату: деньги получены — значит, оплаченное положено. Возвращённая
 * покупка повторно не выдаётся.
 */
export async function fulfillPurchase(payment: PaidPayment): Promise<FulfillResult> {
  return (await fulfillPayment(payment)).result;
}

/** То же, что fulfillPurchase, но сообщает, какой покупке соответствует платёж (у повторного списания — своя). */
export async function fulfillPayment(payment: PaidPayment): Promise<FulfillOutcome> {
  return prisma.$transaction(async (tx) => {
    const outcome = (result: FulfillResult): FulfillOutcome => ({ result, purchaseId: payment.purchaseId });
    const purchase = await tx.purchase.findUnique({ where: { id: payment.purchaseId } });
    if (!purchase) return outcome("not_found");
    if (purchase.provider !== payment.provider || purchase.amount !== payment.amount || purchase.currency !== payment.currency) {
      return outcome("mismatch");
    }
    if (purchase.autoRenew) return fulfillSubscriptionCharge(tx, purchase, payment);
    if (purchase.status === "paid" || purchase.status === "refunded") return outcome("already_paid");

    const flipped = await tx.purchase.updateMany({
      where: { id: purchase.id, status: { in: ["pending", "failed"] } },
      data: { status: "paid", externalId: payment.externalId },
    });
    if (flipped.count === 0) return outcome("already_paid");

    if (purchase.product === "premium_month") {
      await lockUser(tx, purchase.userId);
      const existing = await tx.subscription.findUnique({ where: { userId: purchase.userId } });
      await setPremiumPeriodEnd(tx, purchase.userId, payment, extendPremiumPeriodEnd(existing?.currentPeriodEnd ?? null, new Date()));
    } else {
      await tx.user.update({ where: { id: purchase.userId }, data: { natalChartCredits: { increment: purchase.creditsGranted } } });
    }
    // Первая оплата приглашённого приносит бонус пригласившему (один раз, в той же транзакции).
    await rewardReferrerOnFirstPayment(tx, purchase.userId, purchase.id);
    return outcome("fulfilled");
  });
}

/**
 * Проверка перед оплатой в Telegram: ждём ли мы ещё эту покупку и именно на эту сумму? Счёт подписки после первой
 * оплаты тоже остаётся оплачиваемым: если Telegram спросит подтверждение повторного списания, отказ оборвал бы
 * продление.
 */
export async function isPurchasePayable(input: {
  purchaseId: string;
  provider: PaymentProviderId;
  amount: number;
  currency: PaymentCurrency;
}): Promise<boolean> {
  const purchase = await prisma.purchase.findUnique({ where: { id: input.purchaseId }, include: { starSubscription: { select: { purchaseId: true } } } });
  if (!purchase || purchase.provider !== input.provider || purchase.amount !== input.amount || purchase.currency !== input.currency) return false;
  if (purchase.status === "pending") return true;
  return purchase.autoRenew === true && Boolean(purchase.starSubscription);
}

export type RefundResult = "refunded" | "not_found" | "not_paid" | "already_refunded";

/** Кто оформил возврат: администратор из панели или система по уведомлению платёжного провайдера. */
export interface RefundAudit {
  actor: string;
  reason: string;
}

/**
 * Фиксирует возврат оплаченной покупки и забирает то, что за неё выдано: кредиты пакета натальных карт
 * (не больше текущего остатка: баланс не уходит в минус, а потраченное не вернуть) или месяц Premium
 * (конец периода сдвигается на длину периода назад, при исчерпании подписка прекращается).
 * Повторный вызов безопасен: смена статуса paid → refunded условная, поэтому возврат и уведомление о нём
 * от провайдера, пришедшие одновременно, заберут выданное один раз. Действие пишется в журнал.
 */
export async function markPurchaseRefunded(purchaseId: string, audit: RefundAudit): Promise<RefundResult> {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({ where: { id: purchaseId } });
    if (!purchase) return "not_found";
    if (purchase.status === "refunded") return "already_refunded";
    if (purchase.status !== "paid") return "not_paid";

    // Блокировка строки пользователя: возврат не должен перемешаться с другим изменением баланса или срока.
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${purchase.userId} FOR UPDATE`;

    const flipped = await tx.purchase.updateMany({ where: { id: purchase.id, status: "paid" }, data: { status: "refunded" } });
    if (flipped.count === 0) return "already_refunded";

    const now = new Date();
    const details: Record<string, string | number | null> = {
      purchaseId: purchase.id,
      product: purchase.product,
      provider: purchase.provider,
      amount: purchase.amount,
      currency: purchase.currency,
      reason: audit.reason,
    };

    if (purchase.product === "premium_month") {
      const subscription = await tx.subscription.findUnique({ where: { userId: purchase.userId } });
      if (subscription?.currentPeriodEnd) {
        const shifted = new Date(subscription.currentPeriodEnd.getTime() - PREMIUM_PERIOD_DAYS * 86_400_000);
        const ended = shifted.getTime() <= now.getTime();
        await tx.subscription.update({
          where: { userId: purchase.userId },
          data: ended ? { status: "CANCELED", currentPeriodEnd: now } : { currentPeriodEnd: shifted },
        });
        details.premiumEndBefore = subscription.currentPeriodEnd.toISOString();
        details.premiumEndAfter = (ended ? now : shifted).toISOString();
      }
    } else if (purchase.creditsGranted > 0) {
      const user = await tx.user.findUnique({ where: { id: purchase.userId }, select: { natalChartCredits: true } });
      const revoked = Math.min(user?.natalChartCredits ?? 0, purchase.creditsGranted);
      if (revoked > 0) await tx.user.update({ where: { id: purchase.userId }, data: { natalChartCredits: { decrement: revoked } } });
      details.creditsGranted = purchase.creditsGranted;
      details.creditsRevoked = revoked;
    }

    // Бонус пригласившему за эту покупку тоже забирается: иначе его можно получать, приглашая самого себя.
    const referralRevoked = await revokeReferralRewardForRefund(tx, purchase.userId, purchase.id);
    if (referralRevoked > 0) details.referralBonusRevoked = referralRevoked;

    await tx.adminAction.create({
      data: { adminId: audit.actor, targetUserId: purchase.userId, action: "purchase.refund", details },
    });
    return "refunded";
  });
}

/** Оплаченная покупка у ЮKassa по идентификатору платежа: для уведомления о возврате. */
export async function findYooKassaPurchaseByPaymentId(paymentId: string) {
  return prisma.purchase.findFirst({ where: { provider: "yookassa", externalId: paymentId } });
}

/** Какой товар оплачен: для статистики после уведомления провайдера. */
export async function getPurchaseProduct(purchaseId: string): Promise<string | null> {
  const purchase = await prisma.purchase.findUnique({ where: { id: purchaseId }, select: { product: true } });
  return purchase?.product ?? null;
}
