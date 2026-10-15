import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db";
import { logError } from "@/lib/logger";
import { fetchYooKassaPayment } from "@/lib/payments/providers/yookassa";
import { fulfillPurchase } from "@/lib/repositories/purchase.repository";

/**
 * Уведомления ЮKassa. Телу уведомления сами по себе не доверяем: берём из него только id платежа и
 * перезапрашиваем платёж у ЮKassa с нашими учётными данными (рекомендуемая ими проверка), затем
 * начисляем кредиты по тому, что скажет ЮKassa.
 * Адрес нужно указать в ЮKassa → Настройки → HTTP-уведомления (событие: payment.succeeded).
 */
export async function POST(request: Request) {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secretKey || !isDatabaseConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const notification = (await request.json().catch(() => null)) as { event?: string; object?: { id?: string } } | null;
  const paymentId = notification?.object?.id;
  if (notification?.event !== "payment.succeeded" || typeof paymentId !== "string") {
    // Остальные события (отмена, возврат…) от нас ничего не требуют: отвечаем 200, чтобы ЮKassa
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
