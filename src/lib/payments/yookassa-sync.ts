import { recordEvent } from "@/lib/analytics-store";
import { logError } from "@/lib/logger";
import { fetchYooKassaPayment, type YooKassaCredentials, type YooKassaPayment } from "@/lib/payments/providers/yookassa";
import { notifyBuyer } from "@/lib/payments/notify-buyer";
import { fulfillPurchase, getPurchaseProduct, listPendingPurchases, markPurchaseFailed } from "@/lib/repositories/purchase.repository";

/**
 * Применение платежей ЮKassa к покупкам. Один и тот же путь используют уведомление ЮKassa (вебхук),
 * экран «подтверждаем оплату» после возврата с оплаты и ежедневная сверка: платёж всегда перезапрашивается
 * у ЮKassa нашими ключами, а выдача (fulfillPurchase) идемпотентна, поэтому неважно, кто успел первым.
 */

export type PaymentSyncResult = "fulfilled" | "already_paid" | "pending" | "failed" | "mismatch" | "not_found" | "unavailable";

export function yooKassaCredentials(env: Record<string, string | undefined> = process.env): YooKassaCredentials | null {
  return env.YOOKASSA_SHOP_ID && env.YOOKASSA_SECRET_KEY ? { shopId: env.YOOKASSA_SHOP_ID, secretKey: env.YOOKASSA_SECRET_KEY } : null;
}

/**
 * Применяет к покупке платёж, уже полученный от ЮKassa по API (не из тела уведомления). Отменённый
 * платёж закрывает покупку как неудавшуюся, успешный — выдаёт оплаченное ровно один раз.
 */
export async function applyYooKassaPayment(payment: YooKassaPayment, expectedPurchaseId?: string): Promise<PaymentSyncResult> {
  const purchaseId = payment.metadata?.purchaseId;
  if (!purchaseId || (expectedPurchaseId && purchaseId !== expectedPurchaseId)) return "mismatch";

  if (payment.status === "canceled") {
    await markPurchaseFailed(purchaseId);
    return "failed";
  }
  if (payment.status !== "succeeded" || !payment.paid || payment.amount?.currency !== "RUB") return "pending";

  const result = await fulfillPurchase({
    purchaseId,
    provider: "yookassa",
    externalId: payment.id,
    amount: Math.round(Number(payment.amount.value)),
    currency: "RUB",
  });
  if (result === "fulfilled") {
    await recordEvent({ name: "purchase_paid", product: (await getPurchaseProduct(purchaseId)) ?? undefined, provider: "yookassa" }, { shell: "web" });
    await notifyBuyer(purchaseId);
  }
  if (result === "mismatch") {
    logError("yookassa", "paid amount does not match the purchase", { purchaseId, paid: payment.amount.value });
  }
  return result;
}

/**
 * Сверка неоплаченных покупок ЮKassa: статус каждого платежа спрашивается у ЮKassa. Вызывается после
 * возврата покупателя с оплаты, при открытии страниц с тарифом и раз в сутки по расписанию, поэтому
 * оплаченное выдаётся сразу, даже если уведомление ЮKassa задержалось или не настроено.
 */
export async function syncPendingYooKassaPurchases(options: {
  userId?: string;
  purchaseId?: string;
  maxAgeHours: number;
  limit: number;
  now?: Date;
}): Promise<PaymentSyncResult[]> {
  const credentials = yooKassaCredentials();
  if (!credentials) return [];
  const since = new Date((options.now ?? new Date()).getTime() - options.maxAgeHours * 3_600_000);
  const purchases = await listPendingPurchases({
    provider: "yookassa",
    since,
    take: options.limit,
    userId: options.userId,
    purchaseId: options.purchaseId,
    withPaymentId: true,
  });

  const results: PaymentSyncResult[] = [];
  for (const purchase of purchases) {
    const payment = purchase.externalId ? await fetchYooKassaPayment(credentials, purchase.externalId).catch(() => null) : null;
    results.push(payment ? await applyYooKassaPayment(payment, purchase.id) : "unavailable");
  }
  return results;
}
