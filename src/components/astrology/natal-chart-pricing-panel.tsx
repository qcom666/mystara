"use client";

import { useSession } from "next-auth/react";
import Link from "@/components/shared/localized-link";
import { useCallback } from "react";
import { formatMethodPrice, useCheckout, useRefreshAfterPayment, waitForPurchase, type CheckoutControls } from "@/components/payments/use-checkout";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useLocale, useTranslation } from "@/lib/i18n";
import type { PaymentProviderId } from "@/lib/payments/catalog";
import { getNatalChartPrice } from "@/lib/pricing/natal-chart-pricing";

/** Состояние подписки Premium, нужное панели: подсказка про недельную карту или про оформление. */
export interface PanelPremiumState {
  active: boolean;
  nextFreeChartAt: string | null;
}

/**
 * Показывается везде, где сейчас нельзя построить карту (нет аккаунта или на аккаунте ноль кредитов и
 * нет свободной недельной карты по Premium). Предлагает способ оплаты по месту, где находится покупатель:
 * Звёзды Telegram внутри бота и мини-приложения (правило Telegram для цифровых товаров), карта и СБП
 * через ЮKassa на сайте.
 */
export function NatalChartPricingPanel({
  title,
  body,
  onPurchased,
  premium,
}: {
  title: string;
  body: string;
  onPurchased?: () => void;
  premium?: PanelPremiumState;
}) {
  const t = useTranslation();
  const { locale } = useLocale();
  const { status } = useSession();
  const price = getNatalChartPrice();

  const refreshAfterPayment = useRefreshAfterPayment();

  // Оплата Звёздами в открытом счёте: ждём подтверждения именно этой покупки, затем открываем построение.
  const confirmPayment = useCallback(
    async ({ setBusy, setMessage, purchaseId }: CheckoutControls) => {
      setBusy("confirming");
      const outcome = await waitForPurchase(purchaseId);
      setBusy(null);
      if (outcome === "paid") {
        await refreshAfterPayment();
        onPurchased?.();
      } else {
        setMessage(outcome === "failed" ? t.natalChartPage.paymentFailed : t.natalChartPage.paymentPending);
      }
    },
    [onPurchased, refreshAfterPayment, t.natalChartPage.paymentFailed, t.natalChartPage.paymentPending],
  );

  const { methods, busy, message, buy } = useCheckout("natal_pack", confirmPayment);

  const labels: Record<PaymentProviderId, string> = {
    stars: t.natalChartPage.methodStars,
    yookassa: t.natalChartPage.methodCard,
  };

  const nextFree = premium?.active && premium.nextFreeChartAt
    ? new Date(premium.nextFreeChartAt).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-GB", { day: "numeric", month: "long" })
    : null;

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

      {nextFree ? (
        <p className="mt-4 text-xs text-silver-400">{t.natalChartPage.premiumNextFreeBody.replace("{date}", nextFree)}</p>
      ) : (
        !premium?.active && (
          <p className="mt-4 text-xs text-silver-400">
            {t.natalChartPage.premiumHint}{" "}
            <Link href="/pricing" className="text-gold-300 underline-offset-2 hover:underline">
              {t.natalChartPage.premiumHintLink}
            </Link>
          </p>
        )
      )}
    </GlassPanel>
  );
}
