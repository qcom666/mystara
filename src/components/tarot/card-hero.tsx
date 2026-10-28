"use client";

import { motion, type Variants } from "framer-motion";
import { CardFlipIn } from "@/components/motion/effects";
import { EASE_OUT, SplitWords } from "@/components/motion/reveal";
import { useLocale, useTranslation } from "@/lib/i18n";
import { getCardDescription, getCardKeywords, getCardName } from "@/modules/tarot/domain/deck";
import type { TarotCard } from "@/modules/tarot/domain/types";
import { HoloCard } from "./holo-card";
import { SuitAura } from "./suit-aura";
import { TarotCardFace } from "./tarot-card-face";

const chipsVariants: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.7 } } };
const chipVariants: Variants = {
  hidden: { opacity: 0, scale: 0.4, y: 10 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 320, damping: 16 } },
};

/**
 * Первый экран страницы карты: большая карта переворачивается на место, парит и наклоняется за курсором,
 * за ней живёт атмосфера её масти (SuitAura); рядом название с переливом, ключевые слова выпрыгивают по
 * одному, описание проявляется последним.
 */
export function CardHero({ card }: { card: TarotCard }) {
  const t = useTranslation();
  const { locale } = useLocale();
  const arcana = card.arcana === "major" ? t.reading.majorArcana : card.suit ? t.reading.suits[card.suit] : "";

  return (
    <section className="grid items-center gap-8 md:grid-cols-[minmax(0,20rem)_1fr] md:gap-12">
      <div className="relative mx-auto flex h-[24rem] w-full max-w-[20rem] items-center justify-center sm:h-[27rem]">
        <SuitAura card={card} />
        {/* Парение — CSS-круг: его крутит видеокарта, а не главный поток. */}
        <div className="relative w-44 motion-safe:animate-bob sm:w-52" style={{ animationDuration: "6s", animationDelay: "1.2s" }}>
          <CardFlipIn>
            <HoloCard tilt={14}>
              <TarotCardFace card={card} locale={locale} className="card-glow w-full drop-shadow-2xl" />
            </HoloCard>
          </CardFlipIn>
        </div>
      </div>

      <div className="text-center md:text-left">
        <motion.p
          data-reveal
          className="text-xs uppercase tracking-[0.25em] text-gold-400"
          initial={{ opacity: 0, letterSpacing: "0.6em" }}
          animate={{ opacity: 1, letterSpacing: "0.25em" }}
          transition={{ duration: 1, ease: EASE_OUT }}
        >
          {arcana}
        </motion.p>
        <h1 className="mt-3 font-display text-4xl text-silver-50 sm:text-5xl">
          <SplitWords text={getCardName(card, locale)} immediate delay={0.2} wordClassName="text-shimmer-gold" />
        </h1>
        <motion.ul data-reveal className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start" variants={chipsVariants} initial="hidden" animate="show">
          {getCardKeywords(card, locale).map((keyword) => (
            <motion.li key={keyword} data-reveal variants={chipVariants} className="rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-sm text-gold-200">
              {keyword}
            </motion.li>
          ))}
        </motion.ul>
        <motion.p
          data-reveal
          className="mt-5 text-sm italic leading-relaxed text-silver-400"
          initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 1, ease: EASE_OUT }}
        >
          {getCardDescription(card, locale)}
        </motion.p>
      </div>
    </section>
  );
}
