import {
  NATAL_CHART_PRICE_RUB,
  NATAL_CHART_PRICE_STARS,
  NATAL_CHART_PRICE_USD,
} from "@/lib/pricing/natal-chart-pricing";

/**
 * Payment methods for the Natal Chart pack and what each one costs.
 *
 *  - stars     Telegram Stars (XTR). The only method allowed for digital goods
 *              inside Telegram (bots and Mini Apps) — Telegram's own rule.
 *  - yookassa  Bank cards / SBP in rubles through ЮKassa (website only).
 *  - cryptobot USD-priced invoice paid in USDT or TON through Crypto Pay
 *              (@CryptoBot) (website only).
 */
export type PaymentProviderId = "stars" | "yookassa" | "cryptobot";
export type PaymentCurrency = "XTR" | "RUB" | "USD";
export type PaymentContext = "telegram" | "web";

export interface ProviderPrice {
  amount: number;
  currency: PaymentCurrency;
}

export const NATAL_CHART_PRICES: Record<PaymentProviderId, ProviderPrice> = {
  stars: { amount: NATAL_CHART_PRICE_STARS, currency: "XTR" },
  yookassa: { amount: NATAL_CHART_PRICE_RUB, currency: "RUB" },
  cryptobot: { amount: NATAL_CHART_PRICE_USD, currency: "USD" },
};

export const PAYMENT_PROVIDER_IDS = ["stars", "yookassa", "cryptobot"] as const satisfies readonly PaymentProviderId[];

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
    if (env.CRYPTOBOT_API_TOKEN) providers.push("cryptobot");
  }
  return providers;
}

export function isPaymentProviderId(value: unknown): value is PaymentProviderId {
  return typeof value === "string" && (PAYMENT_PROVIDER_IDS as readonly string[]).includes(value);
}
