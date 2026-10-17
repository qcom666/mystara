import { NATAL_CHART_PRICE_RUB, NATAL_CHART_PRICE_STARS } from "@/lib/pricing/natal-chart-pricing";
import { PREMIUM_PRICE_RUB, PREMIUM_PRICE_STARS } from "@/lib/pricing/premium-pricing";

/**
 * Способы оплаты и стоимость товаров: пакета натальных карт и одного оплаченного периода Premium.
 *
 *  - stars     Telegram Stars (XTR): ТОЛЬКО внутри Telegram-бота и мини-приложения. Это единственный
 *              способ, который Telegram разрешает для цифровых товаров там (его собственное правило).
 *  - yookassa  Банковские карты и СБП в рублях через ЮKassa: ТОЛЬКО на САЙТЕ.
 *
 * Криптовалюты и иностранной валюты здесь намеренно нет: приём цифровой валюты за услуги (и публикация
 * информации о нём) запрещены в России статьёй 14 закона 259-ФЗ, а резидент РФ не может принимать
 * доллары от резидентов.
 */
export type PaymentProviderId = "stars" | "yookassa";
export type PaymentCurrency = "XTR" | "RUB";
export type PaymentContext = "telegram" | "web";

export interface ProviderPrice {
  amount: number;
  currency: PaymentCurrency;
}

/** Что можно купить: пакет натальных карт (начисляет кредиты) и период Premium (продлевает подписку). */
export const PAYMENT_PRODUCT_IDS = ["natal_pack", "premium_month"] as const;
export type PaymentProductId = (typeof PAYMENT_PRODUCT_IDS)[number];

export const PRODUCT_PRICES: Record<PaymentProductId, Record<PaymentProviderId, ProviderPrice>> = {
  natal_pack: {
    stars: { amount: NATAL_CHART_PRICE_STARS, currency: "XTR" },
    yookassa: { amount: NATAL_CHART_PRICE_RUB, currency: "RUB" },
  },
  premium_month: {
    stars: { amount: PREMIUM_PRICE_STARS, currency: "XTR" },
    yookassa: { amount: PREMIUM_PRICE_RUB, currency: "RUB" },
  },
};

export const NATAL_CHART_PRICES = PRODUCT_PRICES.natal_pack;
export const PREMIUM_PRICES = PRODUCT_PRICES.premium_month;

export function isPaymentProductId(value: unknown): value is PaymentProductId {
  return typeof value === "string" && (PAYMENT_PRODUCT_IDS as readonly string[]).includes(value);
}

export const PAYMENT_PROVIDER_IDS = ["stars", "yookassa"] as const satisfies readonly PaymentProviderId[];

type Env = Record<string, string | undefined>;

/**
 * Провайдер, который может принять платёж в этом контексте сейчас: Звёзды внутри Telegram, ЮKassa на
 * сайте: никогда оба сразу и никогда наоборот. Провайдер включается, только когда есть его учётные
 * данные, поэтому чтобы включить его, достаточно добавить ключ в Vercel.
 */
export function enabledProviders(env: Env, context: PaymentContext): PaymentProviderId[] {
  if (context === "telegram") return env.TELEGRAM_BOT_TOKEN ? ["stars"] : [];
  return env.YOOKASSA_SHOP_ID && env.YOOKASSA_SECRET_KEY ? ["yookassa"] : [];
}

export function isPaymentProviderId(value: unknown): value is PaymentProviderId {
  return typeof value === "string" && (PAYMENT_PROVIDER_IDS as readonly string[]).includes(value);
}

/**
 * Можно ли оформить товар подпиской с автопродлением: только Premium и только Звёздами внутри Telegram
 * (createInvoiceLink с subscription_period; такие счета открываются лишь в боте и мини-приложении). На сайте
 * Premium оплачивается разово.
 */
export function supportsAutoRenew(product: PaymentProductId, provider: PaymentProviderId, context: PaymentContext): boolean {
  return product === "premium_month" && provider === "stars" && context === "telegram";
}
