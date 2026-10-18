/**
 * ЮKassa: оплата картой и СБП в рублях. Покупатель перенаправляется на `confirmation_url`; затем ЮKassa
 * присылает `payment.succeeded` на наш вебхук, который перед доверием перезапрашивает платёж по id
 * (рекомендуемая ими проверка).
 * https://yookassa.ru/developers/api
 */
const PRODUCTION_API = "https://api.yookassa.ru/v3";

/**
 * Адрес API. YOOKASSA_API_BASE подменяет его только вне рабочего режима (локальная проверка всего пути
 * оплаты на заглушке ЮKassa); в сборке для Vercel (NODE_ENV=production) всегда используется настоящий адрес.
 */
function apiBase(): string {
  const override = process.env.NODE_ENV !== "production" ? process.env.YOOKASSA_API_BASE?.trim() : undefined;
  return override || PRODUCTION_API;
}

export interface YooKassaCredentials {
  shopId: string;
  secretKey: string;
}

export interface YooKassaRefund {
  id: string;
  /** "pending" | "succeeded" | "canceled" */
  status: string;
  payment_id?: string;
  amount?: { value: string; currency: string };
}

export interface YooKassaPayment {
  id: string;
  status: string;
  paid?: boolean;
  amount?: { value: string; currency: string };
  metadata?: Record<string, string>;
  confirmation?: { confirmation_url?: string };
  /** Когда платёж подтверждён (ISO 8601); есть у успешных платежей. */
  captured_at?: string;
}

function authHeader({ shopId, secretKey }: YooKassaCredentials): string {
  return `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString("base64")}`;
}

export async function createYooKassaPayment(
  credentials: YooKassaCredentials,
  params: { purchaseId: string; amountRub: number; description: string; returnUrl: string },
  fetchImpl: typeof fetch = fetch,
): Promise<{ id: string; confirmationUrl: string }> {
  const response = await fetchImpl(`${apiBase()}/payments`, {
    method: "POST",
    headers: {
      Authorization: authHeader(credentials),
      "Content-Type": "application/json",
      // Одна покупка — один платёж, даже если запрос повторится.
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
  const response = await fetchImpl(`${apiBase()}/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: authHeader(credentials) },
  });
  if (!response.ok) return null;
  return (await response.json().catch(() => null)) as YooKassaPayment | null;
}

/**
 * Возврат платежа целиком. Ключ идемпотентности привязан к покупке, поэтому повторный запрос вернёт
 * тот же возврат, а не создаст второй. Статус "succeeded" означает, что деньги возвращены; "pending" -
 * возврат в обработке, о его завершении сообщит уведомление `refund.succeeded`.
 */
export async function createYooKassaRefund(
  credentials: YooKassaCredentials,
  params: { paymentId: string; amountRub: number; purchaseId: string },
  fetchImpl: typeof fetch = fetch,
): Promise<YooKassaRefund> {
  const response = await fetchImpl(`${apiBase()}/refunds`, {
    method: "POST",
    headers: {
      Authorization: authHeader(credentials),
      "Content-Type": "application/json",
      "Idempotence-Key": `refund-${params.purchaseId}`,
    },
    body: JSON.stringify({ payment_id: params.paymentId, amount: { value: params.amountRub.toFixed(2), currency: "RUB" } }),
  });
  const refund = (await response.json().catch(() => null)) as YooKassaRefund | null;
  if (!response.ok || !refund?.id) throw new Error("yookassa_refund_failed");
  return refund;
}

export async function fetchYooKassaRefund(
  credentials: YooKassaCredentials,
  refundId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<YooKassaRefund | null> {
  const response = await fetchImpl(`${apiBase()}/refunds/${encodeURIComponent(refundId)}`, {
    headers: { Authorization: authHeader(credentials) },
  });
  if (!response.ok) return null;
  return (await response.json().catch(() => null)) as YooKassaRefund | null;
}
