import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db";
import { verifyCryptoBotSignature, type CryptoBotUpdate } from "@/lib/payments/providers/cryptobot";
import { fulfillPurchase } from "@/lib/repositories/purchase.repository";

/**
 * Crypto Pay (@CryptoBot) `invoice_paid` webhook, authenticated by an HMAC over the
 * raw body. Set this URL in @CryptoBot → Crypto Pay → My Apps → your app → Webhooks.
 */
export async function POST(request: Request) {
  const token = process.env.CRYPTOBOT_API_TOKEN;
  if (!token || !isDatabaseConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  if (!verifyCryptoBotSignature(token, rawBody, request.headers.get("crypto-pay-api-signature"))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let update: CryptoBotUpdate;
  try {
    update = JSON.parse(rawBody) as CryptoBotUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const invoice = update.payload;
  if (update.update_type !== "invoice_paid" || !invoice?.payload || invoice.status !== "paid" || invoice.fiat !== "USD") {
    return NextResponse.json({ ok: true });
  }

  const result = await fulfillPurchase({
    purchaseId: invoice.payload,
    provider: "cryptobot",
    externalId: String(invoice.invoice_id),
    amount: Math.round(Number(invoice.amount)),
    currency: "USD",
  });
  if (result === "mismatch") {
    console.error("[cryptobot] paid amount does not match the purchase", { purchaseId: invoice.payload });
  }
  return NextResponse.json({ ok: true });
}
