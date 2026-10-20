"use client";

import { motion } from "framer-motion";
import { PremiumOffer } from "@/components/marketing/premium-offer";
import { EASE_OUT } from "@/components/motion/reveal";
import Link from "@/components/shared/localized-link";
import { CardHero } from "@/components/tarot/card-hero";
import { CardMeaningTabs } from "@/components/tarot/card-detail-content";
import { FavoriteButton } from "@/components/tarot/favorite-button";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useTranslation } from "@/lib/i18n";
import type { TarotCard } from "@/modules/tarot/domain/types";

/** Страница карты: живой первый экран (CardHero), значения во вкладках, приглашение в расклад и Premium. */
export function TarotCardDetailView({ card }: { card: TarotCard }) {
  const t = useTranslation();

  return (
    <div className="mx-auto max-w-4xl overflow-x-clip px-4 py-12 sm:py-16">
      <Link href="/tarot/cards" className="text-sm text-silver-400 hover:text-gold-300">
        ← {t.tarotCardsPage.backToAllCards}
      </Link>

      <div className="mt-6">
        <CardHero card={card} />
      </div>

      <motion.div
        data-reveal
        className="mt-6 flex justify-center md:justify-start"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.2 }}
      >
        <FavoriteButton type="CARD" targetId={card.id} />
      </motion.div>

      <motion.div
        data-reveal
        className="mt-8"
        initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.8, delay: 1.1, ease: EASE_OUT }}
      >
        <GlassPanel scrollReveal={false}>
          <CardMeaningTabs card={card} />
        </GlassPanel>
      </motion.div>

      <div className="mt-10 text-center">
        {/* Длинная надпись на телефоне переносится, а не растягивает страницу вбок. */}
        <Button asChild size="lg" className="h-auto min-h-13 whitespace-normal py-3 shadow-[0_0_40px_-8px_rgba(212,175,55,0.7)]">
          <Link href="/reading">{t.tarotCardsPage.drawThisEnergyCta}</Link>
        </Button>
      </div>

      <PremiumOffer className="mt-16" />
    </div>
  );
}
