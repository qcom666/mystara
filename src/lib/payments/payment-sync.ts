import { logError } from "@/lib/logger";
import { syncPendingStarPurchases } from "@/lib/payments/stars-sync";
import { syncPendingYooKassaPurchases } from "@/lib/payments/yookassa-sync";
import { createRateLimiter } from "@/lib/rate-limit";
import { hasStarSubscriptionDue } from "@/lib/repositories/star-subscription.repository";

/** Как часто одна покупка или один пользователь может запускать сверку Звёзд: история бота читается целиком. */
const starsThrottle = createRateLimiter();

export function starsSyncAllowed(key: string, windowSeconds: number): boolean {
  return starsThrottle.check(`stars-sync:${key}`, { limit: 1, windowSeconds }).allowed;
}

/**
 * Сверка недавних оплат пользователя при открытии тарифов, натальной карты и кабинета: оплата картой и
 * Звёздами засчитывается сразу, даже если уведомление провайдера задержалось. Продление подписки Звёздами,
 * срок которой уже прошёл, ищется в истории за трое суток. Никогда не ломает страницу.
 */
export async function syncUserPaymentsQuietly(userId: string): Promise<void> {
  try {
    await syncPendingYooKassaPurchases({ userId, maxAgeHours: 2, limit: 3 });
    if (starsSyncAllowed(`user:${userId}`, 30)) {
      const now = new Date();
      // Продление, которое так и не пришло (отключено в Telegram, не хватило Звёзд), ищется не чаще раза в 10 минут.
      const renewalDue = (await hasStarSubscriptionDue(userId, new Date(now.getTime() - 72 * 3_600_000), now)) && starsSyncAllowed(`renewal:${userId}`, 600);
      await syncPendingStarPurchases({ userId, maxAgeHours: renewalDue ? 72 : 2, limit: 3, now });
    }
  } catch (error) {
    logError("payment-sync", error);
  }
}
