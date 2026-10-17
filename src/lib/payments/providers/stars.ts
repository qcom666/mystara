import { telegramApiUrl } from "@/lib/telegram/bot-api";

/**
 * Telegram Stars (XTR). Ссылку на оплату создаём на сервере с токеном бота; мини-приложение открывает её
 * через WebApp.openInvoice. Затем Telegram вызывает вебхук бота с `pre_checkout_query` и
 * `successful_payment` (см. src/lib/telegram/payments.ts и /api/telegram/webhook).
 * https://core.telegram.org/bots/payments-stars
 */
export async function createStarsInvoiceLink(
  params: { botToken: string; purchaseId: string; title: string; description: string; amount: number; subscriptionPeriod?: number },
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const response = await fetchImpl(telegramApiUrl(params.botToken, "createInvoiceLink"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: params.title,
      description: params.description,
      payload: params.purchaseId,
      currency: "XTR",
      prices: [{ label: params.title, amount: params.amount }],
      // Подписка с автопродлением: Telegram списывает ту же сумму каждый период и присылает каждое списание
      // как successful_payment с тем же payload. Такой счёт открывается только в боте и мини-приложении.
      ...(params.subscriptionPeriod ? { subscription_period: params.subscriptionPeriod } : {}),
    }),
  });
  const data = (await response.json().catch(() => null)) as { ok?: boolean; result?: string } | null;
  if (!response.ok || !data?.ok || typeof data.result !== "string") throw new Error("stars_invoice_failed");
  return data.result;
}

/**
 * Возврат Звёзд покупателю. Telegram возвращает платёж целиком по идентификатору транзакции из
 * `successful_payment` (он хранится в `Purchase.externalId`) и Telegram ID покупателя.
 * https://core.telegram.org/bots/api#refundstarpayment
 */
export async function refundStarPayment(
  params: { botToken: string; telegramUserId: number; chargeId: string },
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const response = await fetchImpl(telegramApiUrl(params.botToken, "refundStarPayment"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: params.telegramUserId, telegram_payment_charge_id: params.chargeId }),
  });
  const data = (await response.json().catch(() => null)) as { ok?: boolean } | null;
  return response.ok && data?.ok === true;
}

/**
 * Итог запроса к Telegram: "ok" — выполнено; "rejected" — Telegram отказал по существу (подписка уже отменена,
 * закончилась или не найдена), повтор не поможет; "unavailable" — сеть, лимит запросов или сбой Telegram, можно
 * повторить позже.
 */
export type StarSubscriptionEditResult = "ok" | "rejected" | "unavailable";

/**
 * Отключает (`canceled: true`) или снова разрешает продление подписки Звёздами. Подписка указывается
 * идентификатором первой оплаты (`telegram_payment_charge_id`). Отключённая подписка действует до конца оплаченного
 * периода, новых списаний нет. Исключений не бросает.
 * https://core.telegram.org/bots/api#edituserstarsubscription
 */
export async function editStarSubscription(
  params: { botToken: string; telegramUserId: number; chargeId: string; canceled: boolean },
  fetchImpl: typeof fetch = fetch,
): Promise<StarSubscriptionEditResult> {
  try {
    const response = await fetchImpl(telegramApiUrl(params.botToken, "editUserStarSubscription"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: params.telegramUserId, telegram_payment_charge_id: params.chargeId, is_canceled: params.canceled }),
      signal: AbortSignal.timeout(5000),
    });
    const data = (await response.json().catch(() => null)) as { ok?: boolean } | null;
    if (response.ok && data?.ok === true) return "ok";
    return response.status === 429 || response.status >= 500 ? "unavailable" : "rejected";
  } catch {
    return "unavailable";
  }
}
