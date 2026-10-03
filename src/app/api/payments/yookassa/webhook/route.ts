import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db";
import { NATAL_CHART_PRICES } from "@/lib/payments/catalog";
import { fetchYooKassaPayment } from "@/lib/payments/providers/yookassa";
import { fulfillPurchase } from "@/lib/repositories/purchase.repository";

/**
 * ЮKassa notifications. The notification body is never trusted on its own: we
 * take only the payment id from it and re-fetch the payment from ЮKassa with our
 * credentials (their recommended check), then grant credits for what ЮKassa says.
 * Register this URL in ЮKassa → Настройки → HTTP-уведомления (event: payment.succeeded).
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
    // Other events (canceled, refund…) need nothing from us — 200 so ЮKassa stops redelivering.
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
    console.error("[yookassa] paid amount does not match the purchase", { purchaseId, expected: NATAL_CHART_PRICES.yookassa });
  }
  return NextResponse.json({ ok: true });
}
