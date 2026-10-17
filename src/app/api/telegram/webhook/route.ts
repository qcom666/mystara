import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { recordEvent } from "@/lib/analytics-store";
import { isDatabaseConfigured } from "@/lib/db";
import { logError } from "@/lib/logger";
import { fulfillPayment, getFulfilledPurchaseSummary, getPurchaseProduct, isPurchasePayable } from "@/lib/repositories/purchase.repository";
import { setStarSubscriptionState } from "@/lib/repositories/star-subscription.repository";
import { subscribeDailyCard, unsubscribeDailyCard } from "@/lib/repositories/bot-subscriber.repository";
import { rememberTelegramLanguage } from "@/lib/repositories/telegram-user.repository";
import { buildBotReply, buildDailyCommandReply, parseDailyCommand, pickLang, type TelegramUpdate } from "@/lib/telegram/bot-reply";
import { buildPreCheckoutAnswer, parseStarsEvent, type TelegramPaymentUpdate } from "@/lib/telegram/payments";
import { purchaseNoticeKeyboard, purchaseNoticeText, subscriptionStateKeyboard, subscriptionStateText } from "@/lib/telegram/purchase-notice";

/**
 * Вебхук Telegram-бота. После регистрации через `setWebhook` Telegram присылает сюда каждое обновление
 * и возвращает наш секрет в заголовке `X-Telegram-Bot-Api-Secret-Token`; без совпадения запрос
 * отклоняется, так что управлять ботом может только Telegram. Если секрет не настроен, маршрут закрыт.
 *
 * Ответ уходит телом ответа (Telegram выполняет возвращённый `method`), поэтому токен бота и исходящие
 * запросы не нужны. Обрабатываются:
 *  - сообщения в чате (/start, /help, /card, /horoscope, /docs, /support) → ответ с кнопками мини-приложения и документов;
 *  - /daily и /daily off → подписка на «Карту дня» и отписка (нужна база);
 *  - платежи Звёздами: `pre_checkout_query` (подтвердить) и `successful_payment` (выдать оплаченное и
 *    сразу сообщить покупателю в чате, что Premium активен или кредиты начислены). Списания по подписке с
 *    автопродлением приходят так же, каждое со своим `telegram_payment_charge_id`;
 *  - `subscription`: пользователь отключил или снова включил продление подписки, либо списание не прошло —
 *    состояние запоминается, пользователю приходит подтверждение.
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

  // Язык клиента Telegram: на нём бот пишет пользователю об оплате и о продлении Premium.
  const from = update?.message?.from;
  if (from?.id && from.language_code && isDatabaseConfigured()) {
    await rememberTelegramLanguage(String(from.id), from.language_code).catch(() => undefined);
  }

  const stars = parseStarsEvent(update);
  if (stars?.kind === "pre_checkout") {
    // Сумма сверяется с самой покупкой (у каждого товара своя цена), валюта — только Звёзды.
    const payable =
      isDatabaseConfigured() &&
      stars.currency === "XTR" &&
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
      const { result, purchaseId } = await fulfillPayment({
        purchaseId: stars.purchaseId,
        provider: "stars",
        externalId: stars.chargeId,
        amount: stars.amount,
        currency: "XTR",
        subscription: {
          chargedAt: stars.paidAt ?? new Date(),
          expiresAt: stars.recurring?.expiresAt ?? null,
          telegramUserId: stars.telegramUserId !== null ? String(stars.telegramUserId) : null,
        },
      });
      if (result === "fulfilled") {
        if (purchaseId !== stars.purchaseId) {
          await recordEvent({ name: "subscription_renewed", provider: "stars" }, { shell: "telegram" });
        } else {
          const product = (await getPurchaseProduct(stars.purchaseId)) ?? undefined;
          await recordEvent({ name: "purchase_paid", product, provider: "stars", autoRenew: stars.recurring !== null }, { shell: "telegram" });
        }
        // Ответ вебхука сразу уходит покупателю сообщением: что именно выдано и до какого числа.
        const summary = stars.chatId !== null ? await getFulfilledPurchaseSummary(purchaseId) : null;
        if (summary && stars.chatId !== null) {
          const lang = pickLang(stars.languageCode ?? summary.language);
          const appUrl = new URL(request.url).origin;
          return NextResponse.json({
            method: "sendMessage",
            chat_id: stars.chatId,
            text: purchaseNoticeText(summary, lang),
            ...(appUrl.startsWith("https://") ? { reply_markup: purchaseNoticeKeyboard(lang, appUrl, summary.product) } : {}),
          });
        }
      }
      if (result === "mismatch" || result === "not_found") {
        logError("stars", "paid purchase could not be matched", { purchaseId: stars.purchaseId, result: JSON.stringify(result) });
      }
    }
    return NextResponse.json({ ok: true });
  }
  if (stars?.kind === "subscription") {
    if (isDatabaseConfigured()) {
      const updated = await setStarSubscriptionState(stars.purchaseId, stars.state, {
        canceledBy: "user",
        telegramUserId: stars.telegramUserId !== null ? String(stars.telegramUserId) : null,
      });
      if (updated && stars.telegramUserId !== null) {
        const lang = pickLang(stars.languageCode ?? updated.user.language);
        const appUrl = new URL(request.url).origin;
        const details = { premiumUntil: updated.user.subscription?.currentPeriodEnd ?? null, nextChargeAt: updated.expiresAt };
        return NextResponse.json({
          method: "sendMessage",
          chat_id: stars.telegramUserId,
          text: subscriptionStateText(stars.state, details, lang),
          ...(appUrl.startsWith("https://") ? { reply_markup: subscriptionStateKeyboard(lang, appUrl) } : {}),
        });
      }
      if (!updated) logError("stars", "subscription update for an unknown subscription", { purchaseId: stars.purchaseId, state: stars.state });
    }
    return NextResponse.json({ ok: true });
  }

  // Мини-приложение открывается с того же адреса, с которого только что пришёл запрос Telegram,
  // поэтому кнопка всегда ведёт на этот деплой.
  const appUrl = new URL(request.url).origin;

  const daily = update ? parseDailyCommand(update) : null;
  if (daily && isDatabaseConfigured()) {
    if (daily.action === "subscribe") await subscribeDailyCard(String(daily.chatId), daily.lang);
    else await unsubscribeDailyCard(String(daily.chatId));
    return NextResponse.json(buildDailyCommandReply(daily, appUrl));
  }

  const reply = update ? buildBotReply(update, appUrl) : null;

  // Всегда 200: на любой другой код Telegram повторяет то же обновление.
  return NextResponse.json(reply ?? { ok: true });
}
