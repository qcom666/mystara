import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { NATAL_CHART_PRICES, enabledProviders } from "@/lib/payments/catalog";
import { createCryptoBotInvoice } from "@/lib/payments/providers/cryptobot";
import { createStarsInvoiceLink } from "@/lib/payments/providers/stars";
import { createYooKassaPayment } from "@/lib/payments/providers/yookassa";
import { createPendingPurchase, markPurchaseFailed } from "@/lib/repositories/purchase.repository";

const checkoutSchema = z.object({
  provider: z.enum(["stars", "yookassa", "cryptobot"]),
  locale: z.enum(["en", "ru"]).default("en"),
});

const COPY = {
  en: { title: "Natal Chart: 3 charts", description: "A pack of 3 Natal Chart readings on Mystara." },
  ru: { title: "Натальная карта: 3 расклада", description: "Пакет из 3 раскладов натальной карты в Mystara." },
} as const;

/**
 * Starts a purchase of the Natal Chart pack: records a pending purchase, asks the
 * chosen provider for a payment link and returns it. Credits are NOT granted here —
 * only the provider's webhook (after the money really moved) does that, see
 * purchase.repository.ts `fulfillPurchase`.
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
  const { provider, locale } = parsed.data;

  // Credentials decide what is on; the Telegram-only restriction is applied by the client (/api/payments/methods).
  if (!enabledProviders(process.env, "web").includes(provider)) {
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
    if (provider === "yookassa") {
      const payment = await createYooKassaPayment(
        { shopId: process.env.YOOKASSA_SHOP_ID as string, secretKey: process.env.YOOKASSA_SECRET_KEY as string },
        { purchaseId: purchase.id, amountRub: price.amount, description: copy.title, returnUrl },
      );
      return NextResponse.json({ provider, url: payment.confirmationUrl });
    }
    const invoice = await createCryptoBotInvoice(process.env.CRYPTOBOT_API_TOKEN as string, {
      purchaseId: purchase.id,
      amountUsd: price.amount,
      description: copy.title,
      returnUrl,
    });
    return NextResponse.json({ provider, url: invoice.url });
  } catch {
    await markPurchaseFailed(purchase.id);
    return NextResponse.json({ error: "provider_error" }, { status: 502 });
  }
}
