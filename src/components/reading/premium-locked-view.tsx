"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { PremiumOffer } from "@/components/marketing/premium-offer";
import { EASE_OUT, SplitWords } from "@/components/motion/reveal";
import Link from "@/components/shared/localized-link";
import { TarotCardBack } from "@/components/tarot/tarot-card-back";
import { Button } from "@/components/ui/button";
import { useLocale, useTranslation } from "@/lib/i18n";
import { getSpreadDescription, getSpreadName } from "@/modules/tarot/domain/spreads.data";
import type { TarotSpread } from "@/modules/tarot/domain/types";

/**
 * Закрытый премиум-расклад: веер его карт рубашкой вверх раскрывается под мерцающим замком, ниже —
 * предложение Premium и выход к бесплатным раскладам.
 */
export function PremiumLockedView({ spread }: { spread: TarotSpread }) {
  const t = useTranslation();
  const { locale } = useLocale();
  const count = Math.min(spread.cardCount, 7);
  const middle = (count - 1) / 2;

  return (
    <div className="mx-auto max-w-3xl overflow-x-clip px-4 py-14 text-center">
      <div aria-hidden="true" className="relative mx-auto flex h-56 items-end justify-center">
        {Array.from({ length: count }, (_, index) => {
          const offset = index - middle;
          return (
            <motion.div
              key={index}
              data-reveal
              className="absolute bottom-4 w-20 origin-bottom sm:w-24"
              initial={{ opacity: 0, y: 40, rotate: 0 }}
              animate={{ opacity: 1, y: Math.abs(offset) * 6, rotate: offset * 11, x: offset * 26 }}
              transition={{ duration: 0.9, delay: 0.15 + index * 0.07, ease: EASE_OUT }}
            >
              <TarotCardBack className="w-full opacity-80 blur-[1px] drop-shadow-xl" />
            </motion.div>
          );
        })}
        <motion.div
          data-reveal
          className="absolute bottom-20 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full border border-gold-400/50 bg-midnight-950/90 shadow-[0_0_40px_-6px_rgba(212,175,55,0.8)]"
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: [1, 1.08, 1] }}
          transition={{ opacity: { duration: 0.5, delay: 0.8 }, scale: { duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 1 } }}
        >
          <Lock className="h-7 w-7 text-gold-300" />
        </motion.div>
      </div>

      <h1 className="mt-6 font-display text-3xl text-silver-50 sm:text-4xl">
        <SplitWords text={t.premiumLockedPage.title.replace("{name}", getSpreadName(spread, locale))} immediate delay={0.3} />
      </h1>
      <motion.p
        data-reveal
        className="mx-auto mt-3 max-w-xl text-sm text-silver-400"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7, ease: EASE_OUT }}
      >
        {getSpreadDescription(spread, locale)} {t.premiumLockedPage.body}
      </motion.p>

      <PremiumOffer className="mt-10 text-left" />

      <div className="mt-8">
        <Button asChild variant="outline">
          <Link href="/reading">{t.premiumLockedPage.chooseAnotherCta}</Link>
        </Button>
      </div>
    </div>
  );
}
