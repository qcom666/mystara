import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { NATAL_CHART_PRICES, enabledProviders } from "@/lib/payments/catalog";
import { createStarsInvoiceLink } from "@/lib/payments/providers/stars";
import { createYooKassaPayment } from "@/lib/payments/providers/yookassa";
import { createPendingPurchase, markPurchaseFailed } from "@/lib/repositories/purchase.repository";

const checkoutSchema = z.object({
  provider: z.enum(["stars", "yookassa"]),
  locale: z.enum(["en", "ru"]).default("en"),
  // Где находится покупатель: Звёзды для Telegram, ЮKassa для сайта (см. lib/payments/catalog.ts).
  context: z.enum(["telegram", "web"]).default("web"),
});

const COPY = {
  en: { title: "Natal Chart: 3 charts", description: "A pack of 3 Natal Chart readings on Mystara." },
  ru: { title: "Натальная карта: 3 расклада", description: "Пакет из 3 раскладов натальной карты в Mystara." },
} as const;

/**
 * Начинает покупку пакета натальных карт: записывает покупку со статусом pending, запрашивает у выбранного
 * провайдера ссылку на оплату и возвращает её. Кредиты здесь НЕ начисляются: это делает только вебхук
 * провайдера после реального перевода денег (см. fulfillPurchase в purchase.repository.ts).
 */
export async function POST(request: Request) {
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
  const { provider, locale, context } = parsed.data;

  if (!enabledProviders(process.env, context).includes(provider)) {
    return NextResponse.json({ error: "provider_unavailable" }, { status: 400 });
  }

  const price = NATAL_CHART_PRICES[provider];
  const copy = COPY[locale];
  const returnUrl = `${new URL(request.url).origin}/astrology/natal-chart?payment=return`;
  const purchase = await createPendingPurchase({
    userId: session.user.id,
    provider,
    amount: price.amount,
    currency: price.currency,
  });

  try {
    if (provider === "stars") {
      const url = await createStarsInvoiceLink({
        botToken: process.env.TELEGRAM_BOT_TOKEN as string,
        purchaseId: purchase.id,
        title: copy.title,
        description: copy.description,
        amount: price.amount,
      });
      return NextResponse.json({ provider, url });
    }
    const payment = await createYooKassaPayment(
      { shopId: process.env.YOOKASSA_SHOP_ID as string, secretKey: process.env.YOOKASSA_SECRET_KEY as string },
      { purchaseId: purchase.id, amountRub: price.amount, description: copy.title, returnUrl },
    );
    return NextResponse.json({ provider, url: payment.confirmationUrl });
  } catch {
    await markPurchaseFailed(purchase.id);
    return NextResponse.json({ error: "provider_error" }, { status: 502 });
  }
}
