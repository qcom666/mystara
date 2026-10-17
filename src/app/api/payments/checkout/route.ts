import { NextResponse } from "next/server";
import { z } from "zod";
import { recordEvent } from "@/lib/analytics-store";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { toRussianPath } from "@/lib/i18n/localized-routes";
import { PAYMENT_PRODUCT_IDS, PRODUCT_PRICES, enabledProviders, supportsAutoRenew } from "@/lib/payments/catalog";
import { createStarsInvoiceLink } from "@/lib/payments/providers/stars";
import { createYooKassaPayment } from "@/lib/payments/providers/yookassa";
import { attachProviderPaymentId, createPendingPurchase, markPurchaseFailed } from "@/lib/repositories/purchase.repository";
import { hasActiveStarSubscription } from "@/lib/repositories/star-subscription.repository";
import { enforceRateLimit } from "@/lib/rate-limit";
import { STARS_SUBSCRIPTION_PERIOD_SECONDS } from "@/modules/subscriptions/premium";

const checkoutSchema = z.object({
  provider: z.enum(["stars", "yookassa"]),
  // По умолчанию пакет натальных карт: так работали клиенты до появления Premium.
  product: z.enum(PAYMENT_PRODUCT_IDS).default("natal_pack"),
  locale: z.enum(["en", "ru"]).default("en"),
  // Где находится покупатель: Звёзды для Telegram, ЮKassa для сайта (см. lib/payments/catalog.ts).
  context: z.enum(["telegram", "web"]).default("web"),
  // Подписка с автопродлением: только Premium, только Звёздами внутри Telegram (supportsAutoRenew).
  autoRenew: z.boolean().default(false),
});

const COPY = {
  natal_pack: {
    en: { title: "Natal Chart: 3 charts", description: "A pack of 3 Natal Chart readings on Mystara." },
    ru: { title: "Натальная карта: 3 расклада", description: "Пакет из 3 раскладов натальной карты в Mystara." },
  },
  premium_month: {
    en: { title: "Mystara Premium: 30 days", description: "Mystara Premium for 30 days: unlimited readings, all spreads, a Natal Chart every week." },
    ru: { title: "Mystara Premium: 30 дней", description: "Mystara Premium на 30 дней: безлимитные расклады, все расклады, натальная карта раз в неделю." },
  },
} as const;

/** Счёт подписки: Telegram показывает, что оплата повторяется каждые 30 дней. Название не длиннее 32 символов. */
const AUTO_RENEW_COPY = {
  en: {
    title: "Mystara Premium, auto-renewing",
    description: "Mystara Premium, renewed every 30 days until you cancel: unlimited readings, all spreads, a Natal Chart every week. Cancel any time.",
  },
  ru: {
    title: "Mystara Premium, автопродление",
    description: "Mystara Premium с продлением каждые 30 дней, пока вы его не отключите: безлимитные расклады, все расклады, натальная карта раз в неделю.",
  },
} as const;

/** Куда вернуть покупателя после оплаты на стороне провайдера (к адресу добавляется id покупки). */
const RETURN_PATH = {
  natal_pack: "/astrology/natal-chart?payment=return",
  premium_month: "/pricing?payment=return",
} as const;

/**
 * Начинает покупку (пакет натальных карт или период Premium): записывает покупку со статусом pending, запрашивает у выбранного
 * провайдера ссылку на оплату и возвращает её вместе с id покупки. Кредиты здесь НЕ начисляются: это
 * делается только после подтверждения провайдером реального перевода денег (вебхук или сверка через
 * /api/payments/confirm, см. fulfillPurchase в purchase.repository.ts).
 */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "checkout", { limit: 10, windowSeconds: 60 });
  if (limited) return limited;
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "db_not_configured" }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { provider, product, locale, context, autoRenew } = parsed.data;

  if (!enabledProviders(process.env, context).includes(provider)) {
    return NextResponse.json({ error: "provider_unavailable" }, { status: 400 });
  }
  if (autoRenew && !supportsAutoRenew(product, provider, context)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  // Вторая продлевающаяся подписка списывала бы оплату дважды в месяц: её не даём оформить.
  if (autoRenew && (await hasActiveStarSubscription(session.user.id))) {
    return NextResponse.json({ error: "already_subscribed" }, { status: 409 });
  }

  const price = PRODUCT_PRICES[product][provider];
  const copy = autoRenew ? AUTO_RENEW_COPY[locale] : COPY[product][locale];
  const purchase = await createPendingPurchase({
    userId: session.user.id,
    product,
    provider,
    amount: price.amount,
    currency: price.currency,
    autoRenew,
  });
  // По id покупки страница возврата спрашивает сервер, прошла ли оплата (/api/payments/confirm).
  // Русскоязычный покупатель возвращается на русскую версию страницы (/ru/...).
  const returnPath = locale === "ru" ? toRussianPath(RETURN_PATH[product]) : RETURN_PATH[product];
  const returnUrl = `${new URL(request.url).origin}${returnPath}&purchase=${encodeURIComponent(purchase.id)}`;

  try {
    if (provider === "stars") {
      const url = await createStarsInvoiceLink({
        botToken: process.env.TELEGRAM_BOT_TOKEN as string,
        purchaseId: purchase.id,
        title: copy.title,
        description: copy.description,
        amount: price.amount,
        ...(autoRenew ? { subscriptionPeriod: STARS_SUBSCRIPTION_PERIOD_SECONDS } : {}),
      });
      await recordEvent({ name: "checkout_started", product, provider, autoRenew }, { shell: context === "telegram" ? "telegram" : "web", locale });
      return NextResponse.json({ provider, url, purchaseId: purchase.id });
    }
    const payment = await createYooKassaPayment(
      { shopId: process.env.YOOKASSA_SHOP_ID as string, secretKey: process.env.YOOKASSA_SECRET_KEY as string },
      { purchaseId: purchase.id, amountRub: price.amount, description: copy.title, returnUrl },
    );
    await attachProviderPaymentId(purchase.id, payment.id);
    await recordEvent({ name: "checkout_started", product, provider }, { shell: context === "telegram" ? "telegram" : "web", locale });
    return NextResponse.json({ provider, url: payment.confirmationUrl, purchaseId: purchase.id });
  } catch {
    await markPurchaseFailed(purchase.id);
    return NextResponse.json({ error: "provider_error" }, { status: 502 });
  }
}
