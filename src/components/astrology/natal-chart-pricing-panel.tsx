"use client";

import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { useLocale, useTranslation } from "@/lib/i18n";
import { getNatalChartPrice } from "@/lib/pricing/natal-chart-pricing";

/**
 * Shown wherever someone can't generate a chart right now (no account, or
 * an account with zero credits). Purchasing is disabled — see
 * PROJECT_ARCHITECTURE.md §17b: the pricing and credit-gating are real and
 * live, but no payment provider is wired up yet, so a "Buy" button that
 * pretended to charge money would be dishonest, not just unfinished.
 */
export function NatalChartPricingPanel({ title, body }: { title: string; body: string }) {
  const t = useTranslation();
  const { locale } = useLocale();
  const price = getNatalChartPrice(locale);

  return (
    <GlassPanel className="mx-auto w-full max-w-md text-center">
      <h1 className="font-display text-2xl text-silver-50">{title}</h1>
      <p className="mt-2 text-sm text-silver-400">{body}</p>

      <div className="mt-6 rounded-xl border border-gold-500/25 bg-gold-500/5 p-5">
        <p className="font-display text-3xl text-gradient-gold">{price.formatted}</p>
        <p className="mt-1 text-sm text-silver-300">{t.natalChartPage.packSize}</p>
        <p className="mt-1 text-xs text-silver-500">{t.natalChartPage.priceNote}</p>
        <Button disabled className="mt-4 w-full">
          {t.natalChartPage.buyCta} — {t.natalChartPage.comingSoon}
        </Button>
        <p className="mt-3 text-xs text-silver-500">{t.natalChartPage.paymentsNotLive}</p>
      </div>
    </GlassPanel>
  );
}
