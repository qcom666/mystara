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
import { SplitWords } from "@/components/motion/reveal";
import { motion } from "framer-motion";

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
        <h1 className="font-display text-3xl text-silver-50 sm:text-4xl"><SplitWords text={t.pricingPage.title} immediate delay={0.1} /></h1>
        <p className="mt-3 text-silver-400">{t.pricingPage.subtitle}</p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <GlassPanel className="flex flex-col">
          <h2 className="font-display text-2xl text-silver-100">{t.pricingPage.freeTitle}</h2>
          <p className="mt-1 text-sm text-silver-400">{t.pricingPage.freeSubtitle}</p>
          <p className="mt-4 text-3xl text-silver-50">0 ₽</p>
          <ul className="mt-6 flex-1 space-y-3 text-sm text-silver-300">
            {freeFeatures.map((feature, index) => (
              <motion.li
                key={feature}
                data-reveal
                className="flex items-start gap-2"
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.35 + index * 0.08 }}
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                {feature}
              </motion.li>
            ))}
          </ul>
          <Button asChild variant="secondary" className="mt-8">
            <Link href="/reading">{t.pricingPage.startFreeCta}</Link>
          </Button>
        </GlassPanel>

        {/* Без scroll-reveal: оба класса задают animation, и проявление перебило бы пульсирующее свечение. */}
        <GlassPanel variant="solid" scrollReveal={false} className="relative flex flex-col border-gold-500/30 motion-safe:animate-premium-glow">
          {/* Блик, который раз в несколько секунд пробегает по карточке Premium. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
            <div className="absolute -inset-y-12 -left-1/3 w-1/4 rotate-12 bg-gradient-to-r from-transparent via-gold-300/15 to-transparent motion-safe:animate-panel-sheen" />
          </div>
          <Badge variant="gold" className="absolute -top-3 left-6">
            <Sparkles className="h-3 w-3" /> {t.common.premiumBadge}
          </Badge>
          <h2 className="font-display text-2xl text-gold-300">{t.pricingPage.premiumTitle}</h2>
          <p className="mt-1 text-sm text-silver-400">{t.pricingPage.premiumSubtitle}</p>
          <p className="mt-4 text-3xl text-silver-50">
            {premiumPrice.formatted} <span className="text-sm text-silver-400">{t.pricingPage.perPeriod}</span>
          </p>
          <ul className="mt-6 flex-1 space-y-3 text-sm text-silver-300">
            {t.pricingPage.premiumFeatures.map((feature, index) => (
              <motion.li
                key={feature}
                data-reveal
                className="flex items-start gap-2"
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.5 + index * 0.08 }}
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                {feature}
              </motion.li>
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
