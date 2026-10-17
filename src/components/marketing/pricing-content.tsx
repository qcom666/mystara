"use client";

import { Check, Moon, Sparkles } from "lucide-react";
import Link from "@/components/shared/localized-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { PremiumPurchase } from "./premium-purchase";
import { formatReadingsPerDay, useLocale, useTranslation } from "@/lib/i18n";
import { getNatalChartPrice } from "@/lib/pricing/natal-chart-pricing";
import { getPremiumPrice } from "@/lib/pricing/premium-pricing";
import { PLAN_POLICIES } from "@/modules/subscriptions/usage-limit.service";

export function PricingContent() {
  const t = useTranslation();
  const { locale } = useLocale();
  const natalChartPrice = getNatalChartPrice();
  const premiumPrice = getPremiumPrice();
  const maxReadingsPerDay = PLAN_POLICIES.free.maxReadingsPerDay;
  const freeFeatures = [
    ...(maxReadingsPerDay !== null ? [formatReadingsPerDay(maxReadingsPerDay, locale)] : []),
    ...t.pricingPage.freeFeatures,
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:py-24">
      <div className="text-center">
        <h1 className="font-display text-3xl text-silver-50 sm:text-4xl">{t.pricingPage.title}</h1>
        <p className="mt-3 text-silver-400">{t.pricingPage.subtitle}</p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <GlassPanel className="flex flex-col">
          <h2 className="font-display text-2xl text-silver-100">{t.pricingPage.freeTitle}</h2>
          <p className="mt-1 text-sm text-silver-400">{t.pricingPage.freeSubtitle}</p>
          <p className="mt-4 text-3xl text-silver-50">0 ₽</p>
          <ul className="mt-6 flex-1 space-y-3 text-sm text-silver-300">
            {freeFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                {feature}
              </li>
            ))}
          </ul>
          <Button asChild variant="secondary" className="mt-8">
            <Link href="/reading">{t.pricingPage.startFreeCta}</Link>
          </Button>
        </GlassPanel>

        <GlassPanel variant="solid" className="relative flex flex-col border-gold-500/30">
          <Badge variant="gold" className="absolute -top-3 left-6">
            <Sparkles className="h-3 w-3" /> {t.common.premiumBadge}
          </Badge>
          <h2 className="font-display text-2xl text-gold-300">{t.pricingPage.premiumTitle}</h2>
          <p className="mt-1 text-sm text-silver-400">{t.pricingPage.premiumSubtitle}</p>
          <p className="mt-4 text-3xl text-silver-50">
            {premiumPrice.formatted} <span className="text-sm text-silver-400">{t.pricingPage.perPeriod}</span>
          </p>
          <ul className="mt-6 flex-1 space-y-3 text-sm text-silver-300">
            {t.pricingPage.premiumFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                {feature}
              </li>
            ))}
          </ul>
          <PremiumPurchase />
        </GlassPanel>
      </div>

      <div className="mx-auto mt-6 max-w-4xl">
        <GlassPanel className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold-500/30 bg-gold-500/10">
            <Moon className="h-5 w-5 text-gold-400" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-lg text-silver-100">{t.natalChartPage.title}</h2>
            <p className="mt-1 text-sm text-silver-400">{t.natalChartPage.subtitle}</p>
          </div>
          <div className="text-center sm:text-right">
            <p className="font-display text-2xl text-gradient-gold">{natalChartPrice.formatted}</p>
            <p className="text-xs text-silver-500">{t.natalChartPage.packSize}</p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/astrology/natal-chart">{t.natalChartPage.learnMoreCta}</Link>
          </Button>
        </GlassPanel>
      </div>

      <p className="mx-auto mt-10 max-w-lg text-center text-xs text-silver-500">{t.pricingPage.billingNote}</p>
    </div>
  );
}
