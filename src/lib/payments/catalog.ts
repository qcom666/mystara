import { NATAL_CHART_PRICE_RUB, NATAL_CHART_PRICE_STARS } from "@/lib/pricing/natal-chart-pricing";

/**
 * Payment methods for the Natal Chart pack and what each one costs.
 *
 *  - stars     Telegram Stars (XTR). The only method allowed for digital goods
 *              inside Telegram (bots and Mini Apps) — Telegram's own rule.
 *  - yookassa  Bank cards / SBP in rubles through ЮKassa (website only).
 *
 * There is deliberately no crypto-currency and no foreign-currency method: accepting
 * (or advertising the acceptance of) digital currency for services is forbidden in
 * Russia by 259-FZ art. 14, and a Russian resident can't take USD from residents.
 */
export type PaymentProviderId = "stars" | "yookassa";
export type PaymentCurrency = "XTR" | "RUB";
export type PaymentContext = "telegram" | "web";

export interface ProviderPrice {
  amount: number;
  currency: PaymentCurrency;
}

export const NATAL_CHART_PRICES: Record<PaymentProviderId, ProviderPrice> = {
  stars: { amount: NATAL_CHART_PRICE_STARS, currency: "XTR" },
  yookassa: { amount: NATAL_CHART_PRICE_RUB, currency: "RUB" },
};

export const PAYMENT_PROVIDER_IDS = ["stars", "yookassa"] as const satisfies readonly PaymentProviderId[];

type Env = Record<string, string | undefined>;

/**
 * Providers that can take a payment right now — a provider is on only when its
 * credentials are present, so adding a key in Vercel is all it takes to turn
 * one on. Inside Telegram only Stars are offered (see PaymentProviderId).
 */
export function enabledProviders(env: Env, context: PaymentContext): PaymentProviderId[] {
  const providers: PaymentProviderId[] = [];
  if (env.TELEGRAM_BOT_TOKEN) providers.push("stars");
  if (context === "web") {
    if (env.YOOKASSA_SHOP_ID && env.YOOKASSA_SECRET_KEY) providers.push("yookassa");
  }
  return providers;
}

export function isPaymentProviderId(value: unknown): value is PaymentProviderId {
  return typeof value === "string" && (PAYMENT_PROVIDER_IDS as readonly string[]).includes(value);
}
