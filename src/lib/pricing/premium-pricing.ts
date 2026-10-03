/**
 * Premium (unlimited readings, all spreads) is a monthly subscription priced at
 * ₽300, shown in rubles in every language (see natal-chart-pricing.ts).
 *
 * The price is shown on /pricing today; buying it isn't wired up yet (no
 * recurring-payment flow) — the page says so honestly.
 */
export const PREMIUM_PRICE_RUB = 300;

export function getPremiumPrice(): { amount: number; currency: "RUB"; formatted: string } {
  return { amount: PREMIUM_PRICE_RUB, currency: "RUB", formatted: `${PREMIUM_PRICE_RUB} ₽` };
}
