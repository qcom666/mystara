import { prisma } from "@/lib/db";
import { markPurchaseRefunded, type RefundResult } from "@/lib/repositories/purchase.repository";
import { findStarSubscriptionForPurchase } from "@/lib/repositories/star-subscription.repository";
import { createYooKassaRefund } from "./providers/yookassa";
import { refundStarPayment } from "./providers/stars";
import { cancelSubscriptionOfPurchase } from "./star-subscriptions";

export type RefundOutcome =
  | { ok: true; status: "refunded" | "pending" }
  | { ok: false; error: "not_found" | "not_paid" | "already_refunded" | "not_configured" | "no_telegram_user" | "provider_failed" };

/** Нужные переменные окружения: TELEGRAM_BOT_TOKEN, YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY. */
type RefundEnv = Record<string, string | undefined>;

/**
 * Возврат оплаченной покупки по решению администратора: сначала деньги возвращает платёжный провайдер, и
 * только после его согласия у пользователя забирается выданное (кредиты или срок Premium). Если провайдер
 * отказал, ничего в базе не меняется. У ЮKassa возврат может оказаться в обработке: тогда покупка остаётся
 * оплаченной до уведомления `refund.succeeded` (/api/payments/yookassa/webhook), которое довершит дело.
 *
 * Возврат любого списания по подписке Звёздами снимает оплаченный им месяц, как и у разовой покупки, и отключает
 * дальнейшее автопродление подписки.
 */
export async function refundPurchaseByAdmin(
  input: { purchaseId: string; adminId: string; reason: string },
  env: RefundEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<RefundOutcome> {
  const purchase = await prisma.purchase.findUnique({
    where: { id: input.purchaseId },
    include: { user: { select: { telegramId: true } } },
  });
  if (!purchase) return { ok: false, error: "not_found" };
  if (purchase.status === "refunded") return { ok: false, error: "already_refunded" };
  if (purchase.status !== "paid" || !purchase.externalId) return { ok: false, error: "not_paid" };

  const audit = { actor: input.adminId, reason: input.reason };
  const finish = async (): Promise<RefundOutcome> => {
    const result: RefundResult = await markPurchaseRefunded(purchase.id, audit);
    // Параллельный возврат уже забрал выданное: для администратора это тоже успех.
    return result === "refunded" || result === "already_refunded" ? { ok: true, status: "refunded" } : { ok: false, error: result };
  };

  if (purchase.provider === "stars") {
    const botToken = env.TELEGRAM_BOT_TOKEN;
    if (!botToken) return { ok: false, error: "not_configured" };
    // Списание по подписке возвращается тому, кто платил в Telegram, даже если аккаунт с тех пор отвязали.
    const subscription = purchase.autoRenew || purchase.renewalOfId ? await findStarSubscriptionForPurchase(purchase.id) : null;
    const payer = subscription?.telegramUserId || purchase.user.telegramId;
    const telegramUserId = Number(payer);
    if (!payer || !Number.isSafeInteger(telegramUserId)) return { ok: false, error: "no_telegram_user" };
    const refunded = await refundStarPayment({ botToken, telegramUserId, chargeId: purchase.externalId }, fetchImpl).catch(() => false);
    if (!refunded) return { ok: false, error: "provider_failed" };
    const outcome = await finish();
    if (purchase.autoRenew || purchase.renewalOfId) await cancelSubscriptionOfPurchase(purchase.id, env, fetchImpl);
    return outcome;
  }

  if (purchase.provider === "yookassa") {
    if (!env.YOOKASSA_SHOP_ID || !env.YOOKASSA_SECRET_KEY) return { ok: false, error: "not_configured" };
    try {
      const refund = await createYooKassaRefund(
        { shopId: env.YOOKASSA_SHOP_ID, secretKey: env.YOOKASSA_SECRET_KEY },
        { paymentId: purchase.externalId, amountRub: purchase.amount, purchaseId: purchase.id },
        fetchImpl,
      );
      if (refund.status === "succeeded") return finish();
      return refund.status === "pending" ? { ok: true, status: "pending" } : { ok: false, error: "provider_failed" };
    } catch {
      return { ok: false, error: "provider_failed" };
    }
  }

  return { ok: false, error: "not_configured" };
}
