"use client";

import { motion, type Variants } from "framer-motion";
import type { CSSProperties } from "react";
import { Check, Crown } from "lucide-react";
import { useSession } from "next-auth/react";
import { Magnetic } from "@/components/motion/effects";
import { EASE_OUT } from "@/components/motion/reveal";
import Link from "@/components/shared/localized-link";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const listVariants: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.35 } } };
const itemVariants: Variants = {
  hidden: { opacity: 0, x: -14 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};

/**
 * Предложение Premium там, где оно к месту (после толкования, на странице карты, у закрытого расклада).
 * Рамка с бегущим золотым отблеском, парящая корона, преимущества появляются по одному, кнопка тянется
 * к курсору. Только правда: что даёт Premium и сколько стоит, без выдуманных скидок и таймеров. Тем, у кого
 * Premium уже есть, не показывается; пока сессия загружается — тоже (чтобы не мигать у подписчиков).
 */
export function PremiumOffer({ className }: { className?: string }) {
  const t = useTranslation();
  const { data: session, status } = useSession();
  if (status === "loading" || session?.user?.planTier === "premium") return null;

  return (
    <motion.section
      data-reveal
      className={cn("relative mx-auto max-w-2xl overflow-hidden rounded-3xl p-[2px] shadow-[0_0_70px_-24px_rgba(212,175,55,0.65)]", className)}
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, ease: EASE_OUT }}
    >
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 aspect-square w-[160%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,rgba(230,195,104,0.08)_0deg,rgba(243,218,143,1)_70deg,rgba(230,195,104,0.08)_140deg,rgba(167,139,250,0.08)_200deg,rgba(196,176,251,0.9)_270deg,rgba(167,139,250,0.08)_340deg)] motion-safe:animate-border-sweep"
      />
      <div className="noise-overlay relative overflow-hidden rounded-[calc(1.5rem-2px)] bg-midnight-950/95 p-7 sm:p-10">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -inset-y-16 -left-1/3 w-1/4 rotate-12 bg-gradient-to-r from-transparent via-gold-300/15 to-transparent motion-safe:animate-panel-sheen" />
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-violet-500/15 blur-3xl" />
        </div>

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Корона парит и светится CSS-кругами: их крутит видеокарта, а не главный поток. */}
          <div
            aria-hidden="true"
            className="relative flex h-16 w-16 shrink-0 items-center justify-center self-center rounded-2xl border border-gold-400/40 bg-gold-500/10 motion-safe:animate-bob-tilt sm:self-start"
            style={{ "--bob": "-6px" } as CSSProperties}
          >
            <span
              className="absolute inset-0 rounded-2xl bg-gold-400/30 blur-xl motion-safe:animate-glow-pulse"
              style={{ "--glow-min": 0.3, "--glow-max": 0.9, "--glow-scale-min": 1, "--glow-scale-max": 1, animationDuration: "2.6s" } as CSSProperties}
            />
            <Crown className="relative h-8 w-8 text-gold-300" />
          </div>

          <div className="text-center sm:text-left">
            <p className="text-xs uppercase tracking-[0.25em] text-gold-400">{t.premiumOffer.eyebrow}</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl">
              <span className="text-shimmer-gold">{t.premiumOffer.title}</span>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-silver-300">{t.premiumOffer.body}</p>

            <motion.ul className="mt-5 space-y-2 text-left" variants={listVariants} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.5 }}>
              {t.pricingPage.premiumFeatures.map((feature) => (
                <motion.li key={feature} variants={itemVariants} className="flex items-start gap-2 text-sm text-silver-200">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-500/20">
                    <Check className="h-3.5 w-3.5 text-gold-300" />
                  </span>
                  {feature}
                </motion.li>
              ))}
            </motion.ul>

            <div className="mt-7 flex flex-col items-center gap-2 sm:items-start">
              <Magnetic>
                <Button asChild size="lg" className="relative overflow-hidden shadow-[0_0_40px_-8px_rgba(212,175,55,0.75)]">
                  <Link href="/pricing">
                    <span aria-hidden="true" className="pointer-events-none absolute -inset-y-2 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent motion-safe:animate-panel-sheen" />
                    <Crown className="relative h-4 w-4" />
                    <span className="relative">{t.premiumOffer.cta}</span>
                  </Link>
                </Button>
              </Magnetic>
              <p className="text-xs text-silver-500">{t.premiumOffer.note}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
