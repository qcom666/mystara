import { NATAL_CHART_PRICE_RUB, NATAL_CHART_PRICE_STARS } from "@/lib/pricing/natal-chart-pricing";

/**
 * Payment methods for the Natal Chart pack and what each one costs.
 *
 *  - stars     Telegram Stars (XTR) — inside the Telegram bot / Mini App ONLY. It is the
 *              only method Telegram allows for digital goods there (its own rule).
 *  - yookassa  Bank cards / SBP in rubles through ЮKassa — on the WEBSITE only.
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
 * The provider that can take a payment in this context right now: Stars inside
 * Telegram, ЮKassa on the website — never both, never crossed. A provider is on
 * only when its credentials are present, so adding a key in Vercel is all it
 * takes to turn one on.
 */
export function enabledProviders(env: Env, context: PaymentContext): PaymentProviderId[] {
  if (context === "telegram") return env.TELEGRAM_BOT_TOKEN ? ["stars"] : [];
  return env.YOOKASSA_SHOP_ID && env.YOOKASSA_SECRET_KEY ? ["yookassa"] : [];
}

export function isPaymentProviderId(value: unknown): value is PaymentProviderId {
  return typeof value === "string" && (PAYMENT_PROVIDER_IDS as readonly string[]).includes(value);
}
