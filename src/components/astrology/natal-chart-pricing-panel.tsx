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
  return `${price.amount} ₽`;
}

/** true внутри Telegram-бота и мини-приложения: там Звёзды, на сайте ЮKassa. */
const inTelegram = () => Boolean(getTelegramWebApp()?.initData);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Кредиты приходят через вебхук провайдера чуть позже оплаты, поэтому после платежа мы недолго
 * опрашиваем баланс, а не доверяем клиенту.
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
 * Показывается везде, где сейчас нельзя построить карту (нет аккаунта или на аккаунте ноль кредитов).
 * Предлагает способ оплаты по месту, где находится покупатель: Звёзды Telegram внутри бота и
 * мини-приложения (правило Telegram для цифровых товаров), карта и СБП через ЮKassa на сайте.
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
  const price = getNatalChartPrice();

  const [methods, setMethods] = useState<PaymentMethod[] | null>(null);
  const [busy, setBusy] = useState<PaymentProviderId | "confirming" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/payments/methods?context=${inTelegram() ? "telegram" : "web"}`)
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
        body: JSON.stringify({ provider, locale, context: inTelegram() ? "telegram" : "web" }),
      });
      if (!response.ok) throw new Error("checkout_failed");
      const { url } = (await response.json()) as { url: string };

      const telegram = getTelegramWebApp();
      if (provider === "stars" && typeof telegram?.openInvoice === "function") {
        telegram.openInvoice(url, (outcome) => {
          if (outcome === "paid") void confirmPayment();
          else setBusy(null);
        });
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
