import { telegramApiUrl } from "@/lib/telegram/bot-api";

/**
 * Telegram Stars (XTR). Ссылку на оплату создаём на сервере с токеном бота; мини-приложение открывает её
 * через WebApp.openInvoice. Затем Telegram вызывает вебхук бота с `pre_checkout_query` и
 * `successful_payment` (см. src/lib/telegram/payments.ts и /api/telegram/webhook).
 * https://core.telegram.org/bots/payments-stars
 */
export async function createStarsInvoiceLink(
  params: { botToken: string; purchaseId: string; title: string; description: string; amount: number },
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
