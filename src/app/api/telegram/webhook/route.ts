import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db";
import { NATAL_CHART_PRICES } from "@/lib/payments/catalog";
import { fulfillPurchase, isPurchasePayable } from "@/lib/repositories/purchase.repository";
import { buildBotReply, type TelegramUpdate } from "@/lib/telegram/bot-reply";
import { buildPreCheckoutAnswer, parseStarsEvent, type TelegramPaymentUpdate } from "@/lib/telegram/payments";

/**
 * Telegram bot webhook. Telegram POSTs every update here once it's registered with
 * `setWebhook` (see TELEGRAM_SETUP.md) and echoes our secret in the
 * `X-Telegram-Bot-Api-Secret-Token` header — without a match the request is rejected,
 * so only Telegram can drive the bot. Fails closed when the secret isn't configured.
 *
 * Replies go back as the response body (Telegram runs a `method` returned there),
 * so this route needs no bot token and makes no outgoing requests. It handles:
 *  - chat messages (/start, /help) → a greeting with a Mini App button;
 *  - Telegram Stars payments: `pre_checkout_query` (approve) and `successful_payment` (grant credits).
 */

function secretMatches(received: string | null, expected: string): boolean {
  if (!received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 503 });
  }
  if (!secretMatches(request.headers.get("x-telegram-bot-api-secret-token"), secret)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const update = (await request.json().catch(() => null)) as (TelegramUpdate & TelegramPaymentUpdate) | null;

  const stars = parseStarsEvent(update);
  if (stars?.kind === "pre_checkout") {
    const expected = NATAL_CHART_PRICES.stars;
    const payable =
      isDatabaseConfigured() &&
      stars.currency === expected.currency &&
      (await isPurchasePayable({
        purchaseId: stars.purchaseId,
        provider: "stars",
        amount: stars.amount,
        currency: "XTR",
      }));
    return NextResponse.json(buildPreCheckoutAnswer(stars.queryId, payable));
  }
  if (stars?.kind === "paid") {
    if (stars.currency === "XTR" && isDatabaseConfigured()) {
      // A thrown error becomes a 500, so Telegram redelivers the update instead of the payment being lost.
      const result = await fulfillPurchase({
        purchaseId: stars.purchaseId,
        provider: "stars",
        externalId: stars.chargeId,
        amount: stars.amount,
        currency: "XTR",
      });
      if (result === "mismatch" || result === "not_found") {
        console.error("[stars] paid purchase could not be matched", { purchaseId: stars.purchaseId, result });
      }
    }
    return NextResponse.json({ ok: true });
  }

  // The Mini App opens from the same origin Telegram just called, so the button always points at this deployment.
  const reply = update ? buildBotReply(update, new URL(request.url).origin) : null;

  // Always 200 — a non-2xx makes Telegram retry the same update.
  return NextResponse.json(reply ?? { ok: true });
}
