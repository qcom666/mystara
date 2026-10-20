"use client";

import { Check, Crown, Moon, Sparkles } from "lucide-react";
import Link from "@/components/shared/localized-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { PremiumPurchase } from "./premium-purchase";
import { formatReadingsPerDay, useLocale, useTranslation } from "@/lib/i18n";
import { getNatalChartPrice } from "@/lib/pricing/natal-chart-pricing";
import { getPremiumPrice } from "@/lib/pricing/premium-pricing";
import { PLAN_POLICIES } from "@/modules/subscriptions/usage-limit.service";
import { CountUp } from "@/components/motion/effects";
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
        <motion.div className="flex" whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
          <GlassPanel className="flex w-full flex-col">
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
        </motion.div>

        {/* Рамка Premium: под непрозрачной карточкой вращается конический градиент, виден только зазор в 2 px. */}
        <motion.div className="relative flex" whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
          <div aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-[calc(1rem+2px)]">
            <div className="absolute left-1/2 top-1/2 aspect-square w-[180%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,rgba(230,195,104,0.08)_0deg,rgba(243,218,143,1)_70deg,rgba(230,195,104,0.08)_140deg,rgba(167,139,250,0.08)_200deg,rgba(196,176,251,0.9)_270deg,rgba(167,139,250,0.08)_340deg)] motion-safe:animate-border-sweep" />
          </div>
          {/* Без scroll-reveal: оба класса задают animation, и проявление перебило бы пульсирующее свечение. */}
          <GlassPanel variant="solid" scrollReveal={false} className="relative m-[2px] flex w-full flex-col border-0 motion-safe:animate-premium-glow">
            {/* Блик, который раз в несколько секунд пробегает по карточке Premium. */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
              <div className="absolute -inset-y-12 -left-1/3 w-1/4 rotate-12 bg-gradient-to-r from-transparent via-gold-300/15 to-transparent motion-safe:animate-panel-sheen" />
            </div>
            <Badge variant="gold" className="absolute -top-3 left-6">
              <Sparkles className="h-3 w-3" /> {t.common.premiumBadge}
            </Badge>
            <h2 className="flex items-center gap-2 font-display text-2xl">
              <span className="text-shimmer-gold">{t.pricingPage.premiumTitle}</span>
              <motion.span aria-hidden="true" animate={{ y: [0, -4, 0], rotate: [0, -8, 8, 0] }} transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}>
                <Crown className="h-5 w-5 text-gold-300 drop-shadow-[0_0_8px_rgba(243,218,143,0.8)]" />
              </motion.span>
            </h2>
            <p className="mt-1 text-sm text-silver-400">{t.pricingPage.premiumSubtitle}</p>
            <p className="mt-4 text-3xl text-silver-50">
              <CountUp value={premiumPrice.amount} duration={1.2} /> ₽ <span className="text-sm text-silver-400">{t.pricingPage.perPeriod}</span>
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
        </motion.div>
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
