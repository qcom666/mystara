import { prisma } from "@/lib/db";
import type { PaymentCurrency, PaymentProviderId } from "@/lib/payments/catalog";
import { NATAL_CHART_PACK_CREDITS } from "@/lib/pricing/natal-chart-pricing";

/** A pack of Natal Chart credits is the only product so far; each provider has its own price (lib/payments/catalog.ts). */
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
  /** The provider's own transaction id (Stars charge id, ЮKassa payment id, Crypto Pay invoice id). */
  externalId: string;
  /** What the provider says was actually paid — checked against what we asked for. */
  amount: number;
  currency: PaymentCurrency;
}

export type FulfillResult = "fulfilled" | "already_paid" | "not_found" | "mismatch";

/**
 * Turns a confirmed payment into credits — exactly once. The status flip
 * (pending → paid) and the credit grant happen in one transaction, and the
 * flip is a conditional update, so a provider that delivers the same webhook
 * twice (or two webhooks racing) can never grant the pack twice.
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

/** Telegram's pre-checkout gate: is this a purchase we're still waiting on, for exactly this price? */
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
