"use client";

import { useSession } from "next-auth/react";
import Link from "@/components/shared/localized-link";
import { useCallback, useEffect, useState } from "react";
import { formatMethodPrice, sleep, useCheckout, type CheckoutControls } from "@/components/payments/use-checkout";
import { Button } from "@/components/ui/button";
import { useLocale, useTranslation } from "@/lib/i18n";
import type { PaymentProviderId } from "@/lib/payments/catalog";

interface SubscriptionState {
  active: boolean;
  fullAccess: boolean;
  currentPeriodEnd: string | null;
  freeChartAvailable: boolean;
  nextFreeChartAt: string | null;
}

async function loadSubscription(): Promise<SubscriptionState | null> {
  const response = await fetch("/api/subscription").catch(() => null);
  return response?.ok ? ((await response.json()) as SubscriptionState) : null;
}

/**
 * Оплата приходит через вебхук провайдера чуть позже платежа, поэтому после возврата с оплаты мы
 * недолго опрашиваем сервер, пока срок Premium не станет больше прежнего.
 */
async function waitForExtension(previousEnd: string | null): Promise<SubscriptionState | null> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const state = await loadSubscription();
    if (state?.active && state.currentPeriodEnd && (!previousEnd || new Date(state.currentPeriodEnd) > new Date(previousEnd))) return state;
    await sleep(1500);
  }
  return null;
}

/** Блок покупки и состояния Premium на странице тарифов: оформить, продлить, до какого числа действует. */
export function PremiumPurchase() {
  const t = useTranslation();
  const p = t.pricingPage;
  const { locale } = useLocale();
  const { status } = useSession();
  const [state, setState] = useState<SubscriptionState | null>(null);

  const formatDate = useCallback(
    (iso: string) => new Date(iso).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-GB", { day: "numeric", month: "long", year: "numeric" }),
    [locale],
  );

  const onTelegramPaid = useCallback(
    async ({ setBusy, setMessage }: CheckoutControls) => {
      setBusy("confirming");
      const updated = await waitForExtension(state?.currentPeriodEnd ?? null);
      setBusy(null);
      if (updated) setState(updated);
      else setMessage(p.premiumPending);
    },
    [state?.currentPeriodEnd, p.premiumPending],
  );

  const { methods, busy, setBusy, message, setMessage, buy } = useCheckout("premium_month", onTelegramPaid);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    // Возврат со страницы оплаты картой: вебхук мог ещё не отработать.
    const returning = new URLSearchParams(window.location.search).get("payment") === "return";
    (async () => {
      const current = await loadSubscription();
      if (cancelled) return;
      setState(current);
      if (!returning) return;
      setBusy("confirming");
      const updated = await waitForExtension(current?.active ? current.currentPeriodEnd : null);
      if (cancelled) return;
      setBusy(null);
      if (updated) setState(updated);
      else setMessage(p.premiumPending);
    })();
    return () => {
      cancelled = true;
    };
  }, [status, setBusy, setMessage, p.premiumPending]);

  const labels: Record<PaymentProviderId, string> = {
    stars: t.natalChartPage.methodStars,
    yookassa: t.natalChartPage.methodCard,
  };

  if (status === "unauthenticated") {
    return (
      <Button asChild className="mt-8">
        <Link href="/login">{p.premiumSignInCta}</Link>
      </Button>
    );
  }

  if (state?.fullAccess) {
    return <p className="mt-8 rounded-xl border border-gold-500/25 bg-gold-500/5 p-3 text-center text-sm text-gold-300">{p.premiumFullAccess}</p>;
  }

  const cta = state?.active ? p.premiumRenewCta : p.premiumBuyCta;

  return (
    <div className="mt-8">
      {state?.active && state.currentPeriodEnd && (
        <div className="mb-4 rounded-xl border border-gold-500/25 bg-gold-500/5 p-3 text-center text-sm text-gold-300">
          <p>{p.premiumActiveUntil.replace("{date}", formatDate(state.currentPeriodEnd))}</p>
          <p className="mt-1 text-xs text-silver-400">
            {state.freeChartAvailable || !state.nextFreeChartAt
              ? p.premiumFreeChartReady
              : p.premiumNextFreeChart.replace("{date}", formatDate(state.nextFreeChartAt))}
          </p>
        </div>
      )}

      {methods === null || status === "loading" ? (
        <Button disabled className="w-full">
          …
        </Button>
      ) : methods.length === 0 ? (
        <>
          <Button disabled className="w-full">
            {p.comingSoon}
          </Button>
          <p className="mt-3 text-center text-xs text-silver-500">{p.premiumPaymentsNotLive}</p>
        </>
      ) : (
        <div className="flex flex-col gap-2">
          {methods.map((method) => (
            <div key={method.id}>
              <Button className="w-full" disabled={busy !== null} onClick={() => void buy(method.id)}>
                {busy === "confirming" ? p.premiumConfirming : `${cta} — ${formatMethodPrice(method.price)}`}
              </Button>
              <p className="mt-1.5 text-center text-xs text-silver-500">{labels[method.id]}</p>
            </div>
          ))}
          <p className="text-center text-xs text-silver-500">
            {t.natalChartPage.offerNoticePrefix}{" "}
            <Link href="/offer" className="text-gold-300 underline-offset-2 hover:underline">
              {t.natalChartPage.offerNoticeLink}
            </Link>
          </p>
        </div>
      )}

      {message && <p className="mt-3 text-center text-xs text-gold-300">{message}</p>}
    </div>
  );
}
