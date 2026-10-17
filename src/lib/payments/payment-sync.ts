import { logError } from "@/lib/logger";
import { syncPendingStarPurchases } from "@/lib/payments/stars-sync";
import { syncPendingYooKassaPurchases } from "@/lib/payments/yookassa-sync";
import { createRateLimiter } from "@/lib/rate-limit";

/** Как часто одна покупка или один пользователь может запускать сверку Звёзд: история бота читается целиком. */
const starsThrottle = createRateLimiter();

export function starsSyncAllowed(key: string, windowSeconds: number): boolean {
  return starsThrottle.check(`stars-sync:${key}`, { limit: 1, windowSeconds }).allowed;
}

/**
 * Сверка недавних оплат пользователя при открытии тарифов, натальной карты и кабинета: оплата картой и
 * Звёздами засчитывается сразу, даже если уведомление провайдера задержалось. Никогда не ломает страницу.
 */
export async function syncUserPaymentsQuietly(userId: string): Promise<void> {
  try {
    await syncPendingYooKassaPurchases({ userId, maxAgeHours: 2, limit: 3 });
    if (starsSyncAllowed(`user:${userId}`, 30)) await syncPendingStarPurchases({ userId, maxAgeHours: 2, limit: 3 });
  } catch (error) {
    logError("payment-sync", error);
  }
}
