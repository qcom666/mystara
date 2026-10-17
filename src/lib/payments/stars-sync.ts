import { recordEvent } from "@/lib/analytics-store";
import { logError } from "@/lib/logger";
import { notifyBuyer } from "@/lib/payments/notify-buyer";
import type { PaymentSyncResult } from "@/lib/payments/yookassa-sync";
import { fulfillPurchase, getPurchaseProduct, listPendingPurchases } from "@/lib/repositories/purchase.repository";
import { telegramApiUrl } from "@/lib/telegram/bot-api";

/**
 * Сверка оплат Звёздами по истории транзакций бота (Bot API getStarTransactions). Обычно оплату
 * подтверждает вебхук бота (`successful_payment`); сверка — страховка на случай, когда вебхук был
 * недоступен дольше, чем Telegram повторяет доставку: такие оплаты тоже будут выданы.
 * https://core.telegram.org/bots/api#getstartransactions
 */

/** Входящая оплата счёта пользователем: id транзакции совпадает с `telegram_payment_charge_id`. */
export interface IncomingStarPayment {
  chargeId: string;
  purchaseId: string;
  amount: number;
}

interface StarTransaction {
  id: string;
  amount: number;
  date: number;
  source?: { type?: string; transaction_type?: string; invoice_payload?: string };
}

const PAGE = 100;
/** Предел страниц за один вызов: история идёт от старых транзакций к новым, читаем её целиком. */
const MAX_PAGES = 50;

/** Оплаты счетов пользователями начиная с `since`; null, если Telegram не ответил. */
export async function fetchIncomingStarPayments(botToken: string, since: Date, fetchImpl: typeof fetch = fetch): Promise<IncomingStarPayment[] | null> {
  const sinceUnix = Math.floor(since.getTime() / 1000);
  const payments: IncomingStarPayment[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const response = await fetchImpl(telegramApiUrl(botToken, "getStarTransactions"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offset: page * PAGE, limit: PAGE }),
      signal: AbortSignal.timeout(8000),
    }).catch(() => null);
    const data = response?.ok ? ((await response.json().catch(() => null)) as { ok?: boolean; result?: { transactions?: StarTransaction[] } } | null) : null;
    const transactions = data?.ok ? data.result?.transactions : undefined;
    if (!Array.isArray(transactions)) return null;
    for (const transaction of transactions) {
      const source = transaction.source;
      const isInvoicePayment = source?.type === "user" && (source.transaction_type === undefined || source.transaction_type === "invoice_payment");
      if (isInvoicePayment && source?.invoice_payload && transaction.amount > 0 && transaction.date >= sinceUnix) {
        payments.push({ chargeId: transaction.id, purchaseId: source.invoice_payload, amount: transaction.amount });
      }
    }
    if (transactions.length < PAGE) break;
  }
  return payments;
}

/**
 * Выдаёт неоплаченные покупки Звёздами, оплата которых есть в истории транзакций бота. Без ожидающих
 * покупок к Telegram не обращается.
 */
export async function syncPendingStarPurchases(options: {
  userId?: string;
  purchaseId?: string;
  maxAgeHours: number;
  limit: number;
  now?: Date;
}): Promise<PaymentSyncResult[]> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return [];
  const since = new Date((options.now ?? new Date()).getTime() - options.maxAgeHours * 3_600_000);
  const purchases = await listPendingPurchases({ provider: "stars", since, take: options.limit, userId: options.userId, purchaseId: options.purchaseId });
  if (purchases.length === 0) return [];

  const payments = await fetchIncomingStarPayments(botToken, since);
  if (!payments) return purchases.map(() => "unavailable");
  const byPurchase = new Map(payments.map((payment) => [payment.purchaseId, payment]));

  const results: PaymentSyncResult[] = [];
  for (const purchase of purchases) {
    const payment = byPurchase.get(purchase.id);
    if (!payment) {
      results.push("pending");
      continue;
    }
    const result = await fulfillPurchase({ purchaseId: purchase.id, provider: "stars", externalId: payment.chargeId, amount: payment.amount, currency: "XTR" });
    if (result === "fulfilled") {
      await recordEvent({ name: "purchase_paid", product: (await getPurchaseProduct(purchase.id)) ?? undefined, provider: "stars" }, { shell: "telegram" });
      await notifyBuyer(purchase.id);
    }
    if (result === "mismatch") logError("stars-sync", "paid amount does not match the purchase", { purchaseId: purchase.id, paid: payment.amount });
    results.push(result);
  }
  return results;
}
