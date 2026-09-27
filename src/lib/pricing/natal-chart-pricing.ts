/**
 * Natal Chart is a paid-only feature (no free tier, unlike Tarot/numerology/
 * astrology's sun sign) — a real ephemeris computation, priced per the
 * product decision: a pack of 3 for ₽1000.
 *
 * USD_PRICE is a manually-set "same price" equivalent, NOT a live currency
 * conversion — there is no FX feed wired into this app, and one flat number
 * a Russian-market digital product's English-speaking customers see is more
 * defensible than a precise-looking but stale exchange rate. Revisit this
 * number occasionally as RUB/USD drifts; see TODO.md "Natal Chart".
 */
export const NATAL_CHART_PACK_CREDITS = 3;
export const NATAL_CHART_PRICE_RUB = 1000;
export const NATAL_CHART_PRICE_USD = 10;

export function getNatalChartPrice(locale: "en" | "ru"): { amount: number; currency: "RUB" | "USD"; formatted: string } {
  if (locale === "ru") {
    return { amount: NATAL_CHART_PRICE_RUB, currency: "RUB", formatted: `${NATAL_CHART_PRICE_RUB} ₽` };
  }
  return { amount: NATAL_CHART_PRICE_USD, currency: "USD", formatted: `$${NATAL_CHART_PRICE_USD}` };
}
