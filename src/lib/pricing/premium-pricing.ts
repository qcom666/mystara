/**
 * Premium (unlimited readings, all spreads) is a monthly subscription priced at
 * ₽300. The USD figure follows the same "same price, not a live FX rate" rule as
 * the Natal Chart pack (see natal-chart-pricing.ts): ₽300 ≈ $3 at the ~₽100/$
 * the rest of the site uses.
 *
 * The price is shown on /pricing today; buying it isn't wired up yet (no
 * recurring-payment flow) — the page says so honestly.
 */
export const PREMIUM_PRICE_RUB = 300;
export const PREMIUM_PRICE_USD = 3;

export function getPremiumPrice(locale: "en" | "ru"): { amount: number; currency: "RUB" | "USD"; formatted: string } {
  if (locale === "ru") {
    return { amount: PREMIUM_PRICE_RUB, currency: "RUB", formatted: `${PREMIUM_PRICE_RUB} ₽` };
  }
  return { amount: PREMIUM_PRICE_USD, currency: "USD", formatted: `$${PREMIUM_PRICE_USD}` };
}
