import { prisma } from "@/lib/db";
import type { PaymentCurrency, PaymentProductId, PaymentProviderId } from "@/lib/payments/catalog";
import { NATAL_CHART_PACK_CREDITS } from "@/lib/pricing/natal-chart-pricing";
import { extendPremiumPeriodEnd } from "@/modules/subscriptions/premium";

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
