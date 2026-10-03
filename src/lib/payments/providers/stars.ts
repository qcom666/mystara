/**
 * Telegram Stars (XTR). An invoice link is created server-side with the bot
 * token; the Mini App opens it with WebApp.openInvoice. Telegram then calls our
 * bot webhook with `pre_checkout_query` and `successful_payment`
 * (see src/lib/telegram/payments.ts and /api/telegram/webhook).
 * https://core.telegram.org/bots/payments-stars
 */
export async function createStarsInvoiceLink(
  params: { botToken: string; purchaseId: string; title: string; description: string; amount: number },
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const response = await fetchImpl(`https://api.telegram.org/bot${params.botToken}/createInvoiceLink`, {
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
