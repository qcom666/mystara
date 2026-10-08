import { prisma } from "@/lib/db";
import type { PaymentCurrency, PaymentProviderId } from "@/lib/payments/catalog";
import { NATAL_CHART_PACK_CREDITS } from "@/lib/pricing/natal-chart-pricing";

/**
 * Пока единственный товар — пакет кредитов натальной карты; у каждого провайдера своя цена
 * (lib/payments/catalog.ts).
 */
export async function createPendingPurchase(input: {
  userId: string;
  provider: PaymentProviderId;
  amount: number;
  currency: PaymentCurrency;
}) {
  return prisma.natalChartPurchase.create({
    data: {
      userId: input.userId,
      creditsGranted: NATAL_CHART_PACK_CREDITS,
      amount: input.amount,
      currency: input.currency,
      provider: input.provider,
      status: "pending",
    },
  });
}

export async function markPurchaseFailed(purchaseId: string): Promise<void> {
  await prisma.natalChartPurchase.updateMany({ where: { id: purchaseId, status: "pending" }, data: { status: "failed" } });
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
 * Превращает подтверждённый платёж в кредиты — ровно один раз. Смена статуса (pending → paid) и
 * начисление кредитов выполняются в одной транзакции, а сама смена — условное обновление, поэтому
 * провайдер, доставивший то же уведомление дважды (или два уведомления одновременно), не сможет
 * начислить пакет дважды.
 */
export async function fulfillPurchase(payment: PaidPayment): Promise<FulfillResult> {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.natalChartPurchase.findUnique({ where: { id: payment.purchaseId } });
    if (!purchase) return "not_found";
    if (purchase.provider !== payment.provider || purchase.amount !== payment.amount || purchase.currency !== payment.currency) {
      return "mismatch";
    }
    if (purchase.status === "paid") return "already_paid";

    const flipped = await tx.natalChartPurchase.updateMany({
      where: { id: purchase.id, status: "pending" },
      data: { status: "paid", externalId: payment.externalId },
    });
    if (flipped.count === 0) return "already_paid";

    await tx.user.update({ where: { id: purchase.userId }, data: { natalChartCredits: { increment: purchase.creditsGranted } } });
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
  const purchase = await prisma.natalChartPurchase.findUnique({ where: { id: input.purchaseId } });
  return (
    purchase !== null &&
    purchase.status === "pending" &&
    purchase.provider === input.provider &&
    purchase.amount === input.amount &&
    purchase.currency === input.currency
  );
}
