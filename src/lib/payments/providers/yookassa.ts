/**
 * ЮKassa — card / SBP payments in rubles. The buyer is redirected to
 * `confirmation_url`; ЮKassa then POSTs `payment.succeeded` to our webhook,
 * which re-fetches the payment by id before trusting it (their recommended check).
 * https://yookassa.ru/developers/api
 */
const API = "https://api.yookassa.ru/v3";

export interface YooKassaCredentials {
  shopId: string;
  secretKey: string;
}

export interface YooKassaPayment {
  id: string;
  status: string;
  paid?: boolean;
  amount?: { value: string; currency: string };
  metadata?: Record<string, string>;
  confirmation?: { confirmation_url?: string };
}

function authHeader({ shopId, secretKey }: YooKassaCredentials): string {
  return `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString("base64")}`;
}

export async function createYooKassaPayment(
  credentials: YooKassaCredentials,
  params: { purchaseId: string; amountRub: number; description: string; returnUrl: string },
  fetchImpl: typeof fetch = fetch,
): Promise<{ id: string; confirmationUrl: string }> {
  const response = await fetchImpl(`${API}/payments`, {
    method: "POST",
    headers: {
      Authorization: authHeader(credentials),
      "Content-Type": "application/json",
      // One purchase = one payment, even if the request is retried.
      "Idempotence-Key": params.purchaseId,
    },
    body: JSON.stringify({
      amount: { value: params.amountRub.toFixed(2), currency: "RUB" },
      capture: true,
      confirmation: { type: "redirect", return_url: params.returnUrl },
      description: params.description.slice(0, 128),
      metadata: { purchaseId: params.purchaseId },
    }),
  });
  const payment = (await response.json().catch(() => null)) as YooKassaPayment | null;
  const confirmationUrl = payment?.confirmation?.confirmation_url;
  if (!response.ok || !payment?.id || !confirmationUrl) throw new Error("yookassa_payment_failed");
  return { id: payment.id, confirmationUrl };
}

export async function fetchYooKassaPayment(
  credentials: YooKassaCredentials,
  paymentId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<YooKassaPayment | null> {
  const response = await fetchImpl(`${API}/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: authHeader(credentials) },
  });
  if (!response.ok) return null;
  return (await response.json().catch(() => null)) as YooKassaPayment | null;
}
