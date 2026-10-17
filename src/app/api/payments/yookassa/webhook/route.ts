import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db";
import { logWarning } from "@/lib/logger";
import { fetchYooKassaPayment, fetchYooKassaRefund } from "@/lib/payments/providers/yookassa";
import { applyYooKassaPayment, yooKassaCredentials } from "@/lib/payments/yookassa-sync";
import { findYooKassaPurchaseByPaymentId, markPurchaseRefunded } from "@/lib/repositories/purchase.repository";

/**
 * Уведомления ЮKassa. Телу уведомления сами по себе не доверяем: берём из него только id и перезапрашиваем
 * объект у ЮKassa с нашими учётными данными (рекомендуемая ими проверка).
 *  - payment.succeeded → выдаём оплаченное (lib/payments/yookassa-sync.ts, тот же путь, что и сверка после
 *    возврата покупателя), payment.canceled → покупка закрывается как неудавшаяся;
 *  - refund.succeeded → полный возврат забирает выданное, частичный попадает в журнал и разбирается вручную.
 * Если ЮKassa не ответила на перезапрос, отвечаем 502: ЮKassa повторит уведомление, и платёж не потеряется.
 * Адрес нужно указать в ЮKassa → Настройки → HTTP-уведомления (события: payment.succeeded, payment.canceled,
 * refund.succeeded).
 */
export async function POST(request: Request) {
  const credentials = yooKassaCredentials();
  if (!credentials || !isDatabaseConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const notification = (await request.json().catch(() => null)) as { event?: string; object?: { id?: string } } | null;
  const objectId = notification?.object?.id;
  if (typeof objectId !== "string" || !objectId) return NextResponse.json({ ok: true });

  if (notification?.event === "refund.succeeded") {
    const handled = await handleRefundSucceeded(credentials, objectId);
    return handled ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "provider_unavailable" }, { status: 502 });
  }
  if (notification?.event !== "payment.succeeded" && notification?.event !== "payment.canceled") {
    // Остальные события от нас ничего не требуют: 200, чтобы ЮKassa перестала повторять доставку.
    return NextResponse.json({ ok: true });
  }

  const payment = await fetchYooKassaPayment(credentials, objectId).catch(() => null);
  if (!payment) return NextResponse.json({ error: "provider_unavailable" }, { status: 502 });
  await applyYooKassaPayment(payment);
  return NextResponse.json({ ok: true });
}

/**
 * `refundId` - идентификатор возврата из уведомления; вся информация берётся из ответа ЮKassa, а не из тела
 * уведомления. false — ЮKassa не ответила, уведомление нужно получить повторно.
 */
async function handleRefundSucceeded(credentials: { shopId: string; secretKey: string }, refundId: string): Promise<boolean> {
  const refund = await fetchYooKassaRefund(credentials, refundId).catch(() => null);
  if (!refund) return false;
  if (refund.status !== "succeeded" || !refund.payment_id || refund.amount?.currency !== "RUB") return true;

  const purchase = await findYooKassaPurchaseByPaymentId(refund.payment_id);
  if (!purchase) return true;
  if (Math.round(Number(refund.amount.value)) !== purchase.amount) {
    logWarning("yookassa", "partial refund needs manual handling", { purchaseId: purchase.id, refunded: refund.amount.value });
    return true;
  }
  await markPurchaseRefunded(purchase.id, { actor: "system:yookassa", reason: `Возврат ЮKassa ${refund.id}` });
  return true;
}
