/**
 * Правила доступа по подписке Premium: срок оплаченного периода и недельное построение натальной карты.
 * Чистые функции без обращения к базе и сессии (как usage-limit.service.ts): время передаётся
 * параметром, поэтому правила проверяются обычными модульными тестами.
 */

/** Длительность одного оплаченного периода Premium. */
export const PREMIUM_PERIOD_DAYS = 30;
/** Как часто подписчику доступно построение натальной карты без списания кредита. */
export const PREMIUM_NATAL_CHART_INTERVAL_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Нужные поля строки `Subscription`; значения совпадают с перечислениями в схеме Prisma. */
export interface SubscriptionSnapshot {
  tier: "FREE" | "PREMIUM";
  status: "ACTIVE" | "CANCELED" | "PAST_DUE" | "TRIALING";
  currentPeriodEnd: Date | null;
}

/** Premium действует, пока подписка активна и оплаченный период ещё не закончился. */
export function isPremiumActive(subscription: SubscriptionSnapshot | null, now: Date): boolean {
  return (
    subscription !== null &&
    subscription.tier === "PREMIUM" &&
    subscription.status === "ACTIVE" &&
    subscription.currentPeriodEnd !== null &&
    subscription.currentPeriodEnd.getTime() > now.getTime()
  );
}

/**
 * Конец периода после новой оплаты: если Premium ещё действует, срок добавляется к его концу (оплаченные
 * дни не пропадают), иначе отсчёт идёт от момента оплаты.
 */
export function extendPremiumPeriodEnd(currentPeriodEnd: Date | null, now: Date, days: number = PREMIUM_PERIOD_DAYS): Date {
  const base = currentPeriodEnd !== null && currentPeriodEnd.getTime() > now.getTime() ? currentPeriodEnd : now;
  return new Date(base.getTime() + days * DAY_MS);
}

export interface WeeklyNatalChartAllowance {
  /** Можно ли прямо сейчас построить карту без списания кредита. */
  available: boolean;
  /** Когда освободится следующее построение; null, если оно уже доступно или Premium не действует. */
  nextAvailableAt: Date | null;
}

/**
 * Одно построение в `PREMIUM_NATAL_CHART_INTERVAL_DAYS` дней: окно отсчитывается от последнего
 * построения по подписке и не привязано к календарной неделе. Неиспользованные построения не копятся.
 */
export function weeklyNatalChartAllowance(
  premiumActive: boolean,
  lastPremiumChartAt: Date | null,
  now: Date,
): WeeklyNatalChartAllowance {
  if (!premiumActive) return { available: false, nextAvailableAt: null };
  if (lastPremiumChartAt === null) return { available: true, nextAvailableAt: null };
  const next = new Date(lastPremiumChartAt.getTime() + PREMIUM_NATAL_CHART_INTERVAL_DAYS * DAY_MS);
  return next.getTime() <= now.getTime() ? { available: true, nextAvailableAt: null } : { available: false, nextAvailableAt: next };
}
