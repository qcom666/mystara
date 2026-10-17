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

/**
 * Период подписки Звёздами с автопродлением, в секундах (subscription_period в createInvoiceLink). Telegram сейчас
 * разрешает только 30 дней, и он совпадает с оплаченным периодом Premium.
 */
export const STARS_SUBSCRIPTION_PERIOD_SECONDS = PREMIUM_PERIOD_DAYS * 24 * 60 * 60;

/**
 * До какого числа Telegram продлил подписку этим списанием, когда сам он этого не сообщил (оплата найдена сверкой по
 * истории транзакций): Telegram сдвигает срок на период от прежнего конца, а первую оплату отсчитывает от момента
 * списания.
 */
export function estimateSubscriptionExpiration(previousExpiration: Date | null, chargedAt: Date): Date {
  const base = previousExpiration !== null && previousExpiration.getTime() > chargedAt.getTime() ? previousExpiration : chargedAt;
  return new Date(base.getTime() + STARS_SUBSCRIPTION_PERIOD_SECONDS * 1000);
}

/**
 * Конец Premium после списания по подписке Звёздами. Срок задаёт Telegram (subscription_expiration_date): без
 * других оплаченных дней Premium действует ровно до него. Если Premium ещё действует (разовая оплата, промокод,
 * продление администратором), эти дни сохраняются: к концу срока прибавляется то, на сколько Telegram сдвинул
 * подписку (для первой оплаты — целый период), но не раньше конца подписки. Списание, найденное позже более
 * нового (сверка), срок не сдвигает: его период уже учтён.
 */
export function premiumEndAfterSubscriptionCharge(input: {
  currentPeriodEnd: Date | null;
  previousExpiration: Date | null;
  expiresAt: Date;
  now: Date;
}): Date {
  const { currentPeriodEnd, previousExpiration, expiresAt, now } = input;
  if (currentPeriodEnd === null || currentPeriodEnd.getTime() <= now.getTime()) return expiresAt;
  const shift = previousExpiration === null ? PREMIUM_PERIOD_DAYS * DAY_MS : Math.max(0, expiresAt.getTime() - previousExpiration.getTime());
  return new Date(Math.max(currentPeriodEnd.getTime() + shift, expiresAt.getTime()));
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
