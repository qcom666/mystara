import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db";
import { logError } from "@/lib/logger";
import { NATAL_CHART_PRICES } from "@/lib/payments/catalog";
import { fulfillPurchase, isPurchasePayable } from "@/lib/repositories/purchase.repository";
import { buildBotReply, type TelegramUpdate } from "@/lib/telegram/bot-reply";
import { buildPreCheckoutAnswer, parseStarsEvent, type TelegramPaymentUpdate } from "@/lib/telegram/payments";

/**
 * Вебхук Telegram-бота. После регистрации через `setWebhook` Telegram присылает сюда каждое обновление
 * и возвращает наш секрет в заголовке `X-Telegram-Bot-Api-Secret-Token`; без совпадения запрос
 * отклоняется, так что управлять ботом может только Telegram. Если секрет не настроен, маршрут закрыт.
 *
 * Ответ уходит телом ответа (Telegram выполняет возвращённый `method`), поэтому токен бота и исходящие
 * запросы не нужны. Обрабатываются:
 *  - сообщения в чате (/start, /help, /docs, /support) → приветствие с кнопками мини-приложения и документов;
 *  - платежи Звёздами: `pre_checkout_query` (подтвердить) и `successful_payment` (начислить кредиты).
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
      // Исключение превращается в ответ 500, поэтому Telegram повторит доставку обновления, а платёж не потеряется.
      const result = await fulfillPurchase({
        purchaseId: stars.purchaseId,
        provider: "stars",
        externalId: stars.chargeId,
        amount: stars.amount,
        currency: "XTR",
      });
      if (result === "mismatch" || result === "not_found") {
        logError("stars", "paid purchase could not be matched", { purchaseId: stars.purchaseId, result: JSON.stringify(result) });
      }
    }
    return NextResponse.json({ ok: true });
  }

  // Мини-приложение открывается с того же адреса, с которого только что пришёл запрос Telegram,
  // поэтому кнопка всегда ведёт на этот деплой.
  const reply = update ? buildBotReply(update, new URL(request.url).origin) : null;

  // Всегда 200: на любой другой код Telegram повторяет то же обновление.
  return NextResponse.json(reply ?? { ok: true });
}
