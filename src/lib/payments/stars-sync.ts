import { recordEvent } from "@/lib/analytics-store";
import { logError } from "@/lib/logger";
import { notifyBuyer } from "@/lib/payments/notify-buyer";
import type { PaymentSyncResult } from "@/lib/payments/yookassa-sync";
import { findRecordedExternalIds, fulfillPayment, getPurchaseProduct, listPendingPurchases } from "@/lib/repositories/purchase.repository";
import { listStarSubscriptionsDue } from "@/lib/repositories/star-subscription.repository";
import { telegramApiUrl } from "@/lib/telegram/bot-api";

/**
 * Сверка оплат Звёздами по истории транзакций бота (Bot API getStarTransactions). Обычно оплату
 * подтверждает вебхук бота (`successful_payment`); сверка — страховка на случай, когда вебхук был
 * недоступен дольше, чем Telegram повторяет доставку: такие оплаты тоже будут выданы. Это касается и
 * повторных списаний по подписке с автопродлением: у них тот же invoice_payload, что у первой оплаты,
 * но свой идентификатор транзакции.
 * https://core.telegram.org/bots/api#getstartransactions
 */

/** Входящая оплата счёта пользователем: id транзакции совпадает с `telegram_payment_charge_id`. */
export interface IncomingStarPayment {
  chargeId: string;
  purchaseId: string;
  amount: number;
  paidAt: Date;
  /** Telegram ID плательщика, если Telegram его сообщил. */
  telegramUserId: string | null;
  /** Есть у списаний по подписке (StarTransaction.source.subscription_period). */
  subscriptionPeriod: number | null;
}

interface StarTransaction {
  id: string;
  amount: number;
  date: number;
  source?: { type?: string; transaction_type?: string; invoice_payload?: string; subscription_period?: number; user?: { id?: number } };
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
        payments.push({
          chargeId: transaction.id,
          purchaseId: source.invoice_payload,
          amount: transaction.amount,
          paidAt: new Date(transaction.date * 1000),
          telegramUserId: typeof source.user?.id === "number" ? String(source.user.id) : null,
          subscriptionPeriod: typeof source.subscription_period === "number" ? source.subscription_period : null,
        });
      }
    }
    if (transactions.length < PAGE) break;
  }
  return payments;
}

/** Ещё не записанные списания по каждому счёту, от старых к новым: первое по подписке идёт раньше продлений. */
export function groupUnrecordedCharges(payments: IncomingStarPayment[], recorded: Set<string>): Map<string, IncomingStarPayment[]> {
  const byPurchase = new Map<string, IncomingStarPayment[]>();
  for (const payment of [...payments].sort((a, b) => a.paidAt.getTime() - b.paidAt.getTime())) {
    if (recorded.has(payment.chargeId)) continue;
    const list = byPurchase.get(payment.purchaseId) ?? [];
    if (!list.some((known) => known.chargeId === payment.chargeId)) list.push(payment);
    byPurchase.set(payment.purchaseId, list);
  }
  return byPurchase;
}

async function fulfillCharge(purchaseId: string, payment: IncomingStarPayment): Promise<PaymentSyncResult> {
  const { result, purchaseId: chargePurchaseId } = await fulfillPayment({
    purchaseId,
    provider: "stars",
    externalId: payment.chargeId,
    amount: payment.amount,
    currency: "XTR",
    // Срок подписки история транзакций не сообщает: он выводится из прошлого срока и момента списания.
    subscription: { chargedAt: payment.paidAt, expiresAt: null, telegramUserId: payment.telegramUserId },
  });
  if (result === "fulfilled") {
    if (chargePurchaseId !== purchaseId) {
      await recordEvent({ name: "subscription_renewed", provider: "stars" }, { shell: "telegram" });
    } else {
      const product = (await getPurchaseProduct(purchaseId)) ?? undefined;
      await recordEvent({ name: "purchase_paid", product, provider: "stars", autoRenew: payment.subscriptionPeriod !== null }, { shell: "telegram" });
    }
    await notifyBuyer(chargePurchaseId);
  }
  if (result === "mismatch") logError("stars-sync", "paid amount does not match the purchase", { purchaseId, paid: payment.amount });
  return result;
}

/**
 * Выдаёт неоплаченные покупки Звёздами, оплата которых есть в истории транзакций бота, и повторные списания по
 * подпискам, срок которых у Telegram прошёл в окне сверки, а вебхук о продлении не дошёл. Уже записанные списания
 * пропускаются. Без ожидающих покупок и подписок к Telegram не обращается.
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
  const now = options.now ?? new Date();
  const since = new Date(now.getTime() - options.maxAgeHours * 3_600_000);
  const purchases = await listPendingPurchases({ provider: "stars", since, take: options.limit, userId: options.userId, purchaseId: options.purchaseId });
  const pendingIds = new Set(purchases.map((purchase) => purchase.id));
  const due = options.purchaseId
    ? []
    : (await listStarSubscriptionsDue({ since, now, take: options.limit, userId: options.userId })).filter((row) => !pendingIds.has(row.purchaseId));
  if (purchases.length === 0 && due.length === 0) return [];

  const payments = await fetchIncomingStarPayments(botToken, since);
  if (!payments) return [...purchases, ...due].map(() => "unavailable");
  const charges = groupUnrecordedCharges(payments, await findRecordedExternalIds("stars", payments.map((payment) => payment.chargeId)));

  const results: PaymentSyncResult[] = [];
  for (const purchase of purchases) {
    const list = charges.get(purchase.id) ?? [];
    if (list.length === 0) {
      results.push("pending");
      continue;
    }
    // Итог покупки — итог её первого списания; следующие (продления подписки) выдаются вслед за ним.
    let first: PaymentSyncResult | null = null;
    for (const payment of list) {
      const result = await fulfillCharge(purchase.id, payment);
      first ??= result;
    }
    results.push(first ?? "pending");
  }
  for (const subscription of due) {
    for (const payment of charges.get(subscription.purchaseId) ?? []) results.push(await fulfillCharge(subscription.purchaseId, payment));
  }
  return results;
}
