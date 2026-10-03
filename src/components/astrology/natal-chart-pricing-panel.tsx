"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useLocale, useTranslation } from "@/lib/i18n";
import type { PaymentProviderId, ProviderPrice } from "@/lib/payments/catalog";
import { getNatalChartPrice } from "@/lib/pricing/natal-chart-pricing";
import { getTelegramWebApp } from "@/lib/telegram/webapp";

interface PaymentMethod {
  id: PaymentProviderId;
  price: ProviderPrice;
}

function formatMethodPrice(price: ProviderPrice): string {
  if (price.currency === "XTR") return `${price.amount} ⭐`;
  if (price.currency === "RUB") return `${price.amount} ₽`;
  return `$${price.amount}`;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Credits arrive via the provider's webhook, a moment after the buyer pays —
 * so after a payment we poll the balance briefly instead of trusting the client.
 */
async function waitForCredits(): Promise<boolean> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const response = await fetch("/api/natal-chart").catch(() => null);
    if (response?.ok) {
      const data = (await response.json()) as { credits: number };
      if (data.credits > 0) return true;
    }
    await sleep(1500);
  }
  return false;
}

/**
 * Shown wherever someone can't generate a chart right now (no account, or an
 * account with zero credits). Offers whichever payment methods are configured:
 * inside Telegram only Stars (Telegram's rule for digital goods), on the website
 * Stars plus cards/SBP (ЮKassa) and crypto (Crypto Pay).
 */
export function NatalChartPricingPanel({
  title,
  body,
  onPurchased,
}: {
  title: string;
  body: string;
  onPurchased?: () => void;
}) {
  const t = useTranslation();
  const { locale } = useLocale();
  const { status } = useSession();
  const price = getNatalChartPrice(locale);

  const [methods, setMethods] = useState<PaymentMethod[] | null>(null);
  const [busy, setBusy] = useState<PaymentProviderId | "confirming" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const context = getTelegramWebApp()?.initData ? "telegram" : "web";
    let cancelled = false;
    fetch(`/api/payments/methods?context=${context}`)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("failed"))))
      .then((data: { methods: PaymentMethod[] }) => {
        if (!cancelled) setMethods(data.methods);
      })
      .catch(() => {
        if (!cancelled) setMethods([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const labels: Record<PaymentProviderId, string> = {
    stars: t.natalChartPage.methodStars,
    yookassa: t.natalChartPage.methodCard,
    cryptobot: t.natalChartPage.methodCrypto,
  };

  async function confirmPayment() {
    setBusy("confirming");
    const paid = await waitForCredits();
    setBusy(null);
    if (paid) onPurchased?.();
    else setMessage(t.natalChartPage.paymentPending);
  }

  async function buy(provider: PaymentProviderId) {
    setBusy(provider);
    setMessage(null);
    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, locale }),
      });
      if (!response.ok) throw new Error("checkout_failed");
      const { url } = (await response.json()) as { url: string };

      const telegram = getTelegramWebApp();
      if (provider === "stars" && telegram?.initData && typeof telegram.openInvoice === "function") {
        telegram.openInvoice(url, (outcome) => {
          if (outcome === "paid") void confirmPayment();
          else setBusy(null);
        });
        return;
      }
      if (provider === "stars") {
        // On the website a Stars invoice opens in the Telegram app; the buyer comes back and reopens this page.
        window.open(url, "_blank", "noopener");
        setBusy(null);
        setMessage(t.natalChartPage.paymentPending);
        return;
      }
      window.location.assign(url);
    } catch {
      setBusy(null);
      setMessage(t.natalChartPage.checkoutFailed);
    }
  }

  return (
    <GlassPanel className="mx-auto w-full max-w-md text-center">
      <h1 className="font-display text-2xl text-silver-50">{title}</h1>
      <p className="mt-2 text-sm text-silver-400">{body}</p>

      <div className="mt-6 rounded-xl border border-gold-500/25 bg-gold-500/5 p-5">
        <p className="font-display text-3xl text-gradient-gold">{price.formatted}</p>
        <p className="mt-1 text-sm text-silver-300">{t.natalChartPage.packSize}</p>
        <p className="mt-1 text-xs text-silver-500">{t.natalChartPage.priceNote}</p>

        {status === "unauthenticated" ? (
          <Button asChild className="mt-4 w-full">
            <Link href="/login">{t.natalChartPage.signInToBuy}</Link>
          </Button>
        ) : methods === null ? (
          <Button disabled className="mt-4 w-full">
            …
          </Button>
        ) : methods.length === 0 ? (
          <>
            <Button disabled className="mt-4 w-full">
              {t.natalChartPage.buyCta} — {t.natalChartPage.comingSoon}
            </Button>
            <p className="mt-3 text-xs text-silver-500">{t.natalChartPage.paymentsNotLive}</p>
          </>
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-xs text-silver-400">{t.natalChartPage.payWith}</p>
            {methods.map((method) => (
              <Button
                key={method.id}
                variant={method.id === "stars" ? "primary" : "secondary"}
                className="w-full"
                disabled={busy !== null}
                onClick={() => void buy(method.id)}
              >
                {busy === "confirming" ? t.natalChartPage.confirmingPayment : `${labels[method.id]} — ${formatMethodPrice(method.price)}`}
              </Button>
            ))}
          </div>
        )}

        {methods !== null && methods.length > 0 && (
          <p className="mt-3 text-xs text-silver-500">
            {t.natalChartPage.offerNoticePrefix}{" "}
            <Link href="/offer" className="text-gold-300 underline-offset-2 hover:underline">
              {t.natalChartPage.offerNoticeLink}
            </Link>
          </p>
        )}

        {message && <p className="mt-3 text-xs text-gold-300">{message}</p>}
      </div>
    </GlassPanel>
  );
}
