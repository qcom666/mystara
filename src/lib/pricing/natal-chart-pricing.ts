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

/**
 * TEMPORARY (requested by the product owner to try the feature out): while
 * this is `true`, anyone can generate a Natal Chart for free, unsaved, with
 * no sign-in and no credit spent — both the client (NatalChartFlow) and the
 * server (`POST /api/natal-chart`) check it and skip the paywall entirely.
 * This also happens to be the only way to exercise the feature at all in an
 * environment with no `DATABASE_URL`, since the real paywall requires both
 * an account and persistence.
 *
 * Flip to `false` once real accounts + a payment provider are live — nothing
 * else needs to change, the full credit/save logic below is untouched and
 * ready. Tracked in TODO.md "Natal Chart" so it isn't forgotten before launch.
 */
export const NATAL_CHART_FREE_FOR_TESTING = true;

export function getNatalChartPrice(locale: "en" | "ru"): { amount: number; currency: "RUB" | "USD"; formatted: string } {
  if (locale === "ru") {
    return { amount: NATAL_CHART_PRICE_RUB, currency: "RUB", formatted: `${NATAL_CHART_PRICE_RUB} ₽` };
  }
  return { amount: NATAL_CHART_PRICE_USD, currency: "USD", formatted: `$${NATAL_CHART_PRICE_USD}` };
}
