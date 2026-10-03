/**
 * Natal Chart is a paid-only feature (no free tier, unlike Tarot/numerology/
 * astrology's sun sign) — a real ephemeris computation, priced per the
 * product decision: a pack of 3 for ₽1000. Prices are shown in rubles in every
 * language: the only currencies the seller can take are rubles (ЮKassa) and
 * Telegram Stars.
 */
export const NATAL_CHART_PACK_CREDITS = 3;
export const NATAL_CHART_PRICE_RUB = 1000;
/**
 * Telegram Stars price of the same pack. Stars are what Telegram requires for
 * digital goods bought inside its apps; a buyer pays roughly $0.02 per Star, so
 * 500 ⭐ lands near the ₽1000 price. Tune it here, nowhere else.
 */
export const NATAL_CHART_PRICE_STARS = 500;

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

export function getNatalChartPrice(): { amount: number; currency: "RUB"; formatted: string } {
  return { amount: NATAL_CHART_PRICE_RUB, currency: "RUB", formatted: `${NATAL_CHART_PRICE_RUB} ₽` };
}
