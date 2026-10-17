import { logWarning } from "@/lib/logger";
import { findStarSubscriptionForPurchase, listActiveStarSubscriptions, setStarSubscriptionState } from "@/lib/repositories/star-subscription.repository";
import { editStarSubscription, type StarSubscriptionEditResult } from "./providers/stars";

/**
 * Отключение автопродления подписки Звёздами от имени бота (editUserStarSubscription): кнопкой в кабинете, при
 * возврате списания и при удалении аккаунта. Отключённая подписка действует до конца оплаченного срока, новых
 * списаний нет. Сам пользователь может отключить продление и в Telegram — тогда об этом сообщит вебхук.
 */

type Env = Record<string, string | undefined>;

interface CancelableSubscription {
  purchaseId: string;
  chargeId: string;
  telegramUserId: string;
}

export async function cancelStarSubscription(
  subscription: CancelableSubscription,
  env: Env = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<StarSubscriptionEditResult> {
  const botToken = env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return "unavailable";
  const telegramUserId = Number(subscription.telegramUserId);
  if (!subscription.telegramUserId || !Number.isSafeInteger(telegramUserId)) return "rejected";
  const result = await editStarSubscription({ botToken, telegramUserId, chargeId: subscription.chargeId, canceled: true }, fetchImpl);
  if (result === "ok") await setStarSubscriptionState(subscription.purchaseId, "canceled", { canceledBy: "bot" });
  else logWarning("star-subscription", "telegram did not cancel the subscription", { purchaseId: subscription.purchaseId, result });
  return result;
}

/**
 * Отключает продление всех подписок пользователя. Итог: "ok", если отключать нечего или всё отключено;
 * "unavailable", если хотя бы одну не удалось отключить из-за сбоя Telegram (можно повторить); иначе "rejected".
 */
export async function cancelUserStarSubscriptions(
  userId: string,
  env: Env = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<{ result: StarSubscriptionEditResult; canceled: number }> {
  const subscriptions = await listActiveStarSubscriptions(userId);
  let canceled = 0;
  let result: StarSubscriptionEditResult = "ok";
  for (const subscription of subscriptions) {
    const outcome = await cancelStarSubscription(subscription, env, fetchImpl);
    if (outcome === "ok") canceled += 1;
    else if (outcome === "unavailable" || result === "ok") result = outcome;
  }
  return { result, canceled };
}

/** После возврата списания по подписке её продление отключается: деньги вернули — новых списаний быть не должно. */
export async function cancelSubscriptionOfPurchase(purchaseId: string, env: Env = process.env, fetchImpl: typeof fetch = fetch): Promise<void> {
  const subscription = await findStarSubscriptionForPurchase(purchaseId);
  if (subscription?.state === "active") await cancelStarSubscription(subscription, env, fetchImpl);
}
