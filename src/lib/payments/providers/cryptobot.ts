import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Crypto Pay (@CryptoBot). The invoice is priced in USD and the buyer pays it
 * in USDT or TON; Crypto Pay POSTs `invoice_paid` to our webhook, signed with
 * HMAC-SHA256 keyed by SHA256(api token) in the `crypto-pay-api-signature`
 * header. https://help.send.tg/en/articles/10279948-crypto-pay-api
 */
const API = "https://pay.crypt.bot/api";

export interface CryptoBotInvoice {
  invoice_id: number;
  status?: string;
  payload?: string;
  currency_type?: string;
  fiat?: string;
  amount?: string;
  bot_invoice_url?: string;
  web_app_invoice_url?: string;
}

export interface CryptoBotUpdate {
  update_type?: string;
  payload?: CryptoBotInvoice;
}

export async function createCryptoBotInvoice(
  token: string,
  params: { purchaseId: string; amountUsd: number; description: string; returnUrl: string },
  fetchImpl: typeof fetch = fetch,
): Promise<{ id: number; url: string }> {
  const response = await fetchImpl(`${API}/createInvoice`, {
    method: "POST",
    headers: { "Crypto-Pay-API-Token": token, "Content-Type": "application/json" },
    body: JSON.stringify({
      currency_type: "fiat",
      fiat: "USD",
      accepted_assets: "USDT,TON",
      amount: String(params.amountUsd),
      description: params.description.slice(0, 1024),
      payload: params.purchaseId,
      paid_btn_name: "callback",
      paid_btn_url: params.returnUrl,
    }),
  });
  const data = (await response.json().catch(() => null)) as { ok?: boolean; result?: CryptoBotInvoice } | null;
  const invoice = data?.result;
  const url = invoice?.web_app_invoice_url ?? invoice?.bot_invoice_url;
  if (!response.ok || !data?.ok || !invoice || !url) throw new Error("cryptobot_invoice_failed");
  return { id: invoice.invoice_id, url };
}

export function verifyCryptoBotSignature(token: string, rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const secret = createHash("sha256").update(token).digest();
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(signature.toLowerCase());
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
