import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db";
import { logError, logWarning } from "@/lib/logger";
import { fetchYooKassaPayment, fetchYooKassaRefund } from "@/lib/payments/providers/yookassa";
import { findYooKassaPurchaseByPaymentId, fulfillPurchase, markPurchaseRefunded } from "@/lib/repositories/purchase.repository";

/**
 * Уведомления ЮKassa. Телу уведомления сами по себе не доверяем: берём из него только id платежа и
 * перезапрашиваем платёж у ЮKassa с нашими учётными данными (рекомендуемая ими проверка), затем
 * начисляем кредиты по тому, что скажет ЮKassa.
 * Для возвратов (событие refund.succeeded) то же правило: возврат перезапрашивается у ЮKassa, и если он
 * полный, у пользователя забирается выданное. Частичный возврат автоматически не обрабатывается: он
 * попадает в журнал, дальше его разбирает администратор вручную (кредиты и Premium в панели).
 * Адрес нужно указать в ЮKassa → Настройки → HTTP-уведомления (события: payment.succeeded, refund.succeeded).
 */
export async function POST(request: Request) {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secretKey || !isDatabaseConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const notification = (await request.json().catch(() => null)) as { event?: string; object?: { id?: string } } | null;
  const paymentId = notification?.object?.id;
  if (notification?.event === "refund.succeeded" && typeof paymentId === "string") {
    await handleRefundSucceeded({ shopId, secretKey }, paymentId);
    return NextResponse.json({ ok: true });
  }
  if (notification?.event !== "payment.succeeded" || typeof paymentId !== "string") {
    // Остальные события (отмена и т. п.) от нас ничего не требуют: отвечаем 200, чтобы ЮKassa
    // перестала повторять доставку.
    return NextResponse.json({ ok: true });
  }

  const payment = await fetchYooKassaPayment({ shopId, secretKey }, paymentId);
  const purchaseId = payment?.metadata?.purchaseId;
  if (!payment || payment.status !== "succeeded" || !payment.paid || !purchaseId || payment.amount?.currency !== "RUB") {
    return NextResponse.json({ ok: true });
  }

  const result = await fulfillPurchase({
    purchaseId,
    provider: "yookassa",
    externalId: payment.id,
    amount: Math.round(Number(payment.amount.value)),
    currency: "RUB",
  });
  if (result === "mismatch") {
    logError("yookassa", "paid amount does not match the purchase", { purchaseId, paid: String(payment.amount) });
  }
  return NextResponse.json({ ok: true });
}

/** `refundId` - идентификатор возврата из уведомления; вся информация берётся из ответа ЮKassa, а не из тела уведомления. */
async function handleRefundSucceeded(credentials: { shopId: string; secretKey: string }, refundId: string): Promise<void> {
  const refund = await fetchYooKassaRefund(credentials, refundId);
  if (!refund || refund.status !== "succeeded" || !refund.payment_id || refund.amount?.currency !== "RUB") return;

  const purchase = await findYooKassaPurchaseByPaymentId(refund.payment_id);
  if (!purchase) return;
  if (Math.round(Number(refund.amount.value)) !== purchase.amount) {
    logWarning("yookassa", "partial refund needs manual handling", { purchaseId: purchase.id, refunded: refund.amount.value });
    return;
  }
  await markPurchaseRefunded(purchase.id, { actor: "system:yookassa", reason: `Возврат ЮKassa ${refund.id}` });
}
