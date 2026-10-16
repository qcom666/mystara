import { prisma } from "@/lib/db";
import type { PaymentCurrency, PaymentProductId, PaymentProviderId } from "@/lib/payments/catalog";
import { NATAL_CHART_PACK_CREDITS } from "@/lib/pricing/natal-chart-pricing";
import { extendPremiumPeriodEnd, PREMIUM_PERIOD_DAYS } from "@/modules/subscriptions/premium";

/**
 * Создаёт покупку в статусе pending. У каждого провайдера своя цена (lib/payments/catalog.ts); пакет
 * натальных карт при оплате начисляет кредиты, период Premium — продлевает подписку.
 */
export async function createPendingPurchase(input: {
  userId: string;
  product: PaymentProductId;
  provider: PaymentProviderId;
  amount: number;
  currency: PaymentCurrency;
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
    },
  });
}

export async function markPurchaseFailed(purchaseId: string): Promise<void> {
  await prisma.purchase.updateMany({ where: { id: purchaseId, status: "pending" }, data: { status: "failed" } });
}

export interface PaidPayment {
  purchaseId: string;
  provider: PaymentProviderId;
  /** Собственный идентификатор транзакции у провайдера (id платежа Stars, id платежа ЮKassa). */
  externalId: string;
  /** Что провайдер сообщает о реальной оплате: сверяется с тем, что мы запрашивали. */
  amount: number;
  currency: PaymentCurrency;
}

export type FulfillResult = "fulfilled" | "already_paid" | "not_found" | "mismatch";

/**
 * Превращает подтверждённый платёж в то, что оплачено, ровно один раз: кредиты (пакет натальных карт)
 * или продление Premium. Смена статуса (pending → paid) и выдача выполняются в одной транзакции, а
 * сама смена — условное обновление, поэтому провайдер, доставивший то же уведомление дважды (или два
 * уведомления одновременно), не выдаст оплаченное дважды.
 */
export async function fulfillPurchase(payment: PaidPayment): Promise<FulfillResult> {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({ where: { id: payment.purchaseId } });
    if (!purchase) return "not_found";
    if (purchase.provider !== payment.provider || purchase.amount !== payment.amount || purchase.currency !== payment.currency) {
      return "mismatch";
    }
    if (purchase.status === "paid") return "already_paid";

    const flipped = await tx.purchase.updateMany({
      where: { id: purchase.id, status: "pending" },
      data: { status: "paid", externalId: payment.externalId },
    });
    if (flipped.count === 0) return "already_paid";

    if (purchase.product === "premium_month") {
      // Блокировка строки пользователя: две одновременные оплаты не должны прочитать один и тот же конец периода.
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${purchase.userId} FOR UPDATE`;
      const existing = await tx.subscription.findUnique({ where: { userId: purchase.userId } });
      const currentPeriodEnd = extendPremiumPeriodEnd(existing?.currentPeriodEnd ?? null, new Date());
      const data = { tier: "PREMIUM" as const, status: "ACTIVE" as const, provider: payment.provider, externalId: payment.externalId, currentPeriodEnd };
      await tx.subscription.upsert({ where: { userId: purchase.userId }, create: { userId: purchase.userId, ...data }, update: data });
    } else {
      await tx.user.update({ where: { id: purchase.userId }, data: { natalChartCredits: { increment: purchase.creditsGranted } } });
    }
    return "fulfilled";
  });
}

/** Проверка перед оплатой в Telegram: ждём ли мы ещё эту покупку и именно на эту сумму? */
export async function isPurchasePayable(input: {
  purchaseId: string;
  provider: PaymentProviderId;
  amount: number;
  currency: PaymentCurrency;
}): Promise<boolean> {
  const purchase = await prisma.purchase.findUnique({ where: { id: input.purchaseId } });
  return (
    purchase !== null &&
    purchase.status === "pending" &&
    purchase.provider === input.provider &&
    purchase.amount === input.amount &&
    purchase.currency === input.currency
  );
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
