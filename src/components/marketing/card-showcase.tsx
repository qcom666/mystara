"use client";

import { motion } from "framer-motion";
import { EASE_OUT, SectionHeading } from "@/components/motion/reveal";
import { HoloCard } from "@/components/tarot/holo-card";
import { TarotCardFace } from "@/components/tarot/tarot-card-face";
import { useLocale, useTranslation } from "@/lib/i18n";
import { getMajorArcana } from "@/modules/tarot/domain/deck";

const FEATURED_IDS = ["the-fool", "the-magician", "the-star", "the-sun", "the-world", "strength"];

/**
 * Карты раздаются, как из колоды: вылетают снизу по очереди и ложатся лёгким веером, при наведении карта
 * выпрямляется и приподнимается.
 */
export function CardShowcase() {
  const t = useTranslation();
  const { locale } = useLocale();
  const cards = getMajorArcana().filter((card) => FEATURED_IDS.includes(card.id));
  const middle = (cards.length - 1) / 2;

  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow={t.marketing.cardShowcase.eyebrow} title={t.marketing.cardShowcase.title} subtitle={t.marketing.cardShowcase.body} />
      </div>
      {/* Контейнер сжимается до ширины карт и центрируется; когда они не помещаются (телефон), он занимает всю доступную ширину и прокручивается, а первая карта остаётся доступной (justify-center обрезал бы её слева). Отступы сверху и снизу — место для подъёма и наклона карт. */}
      <div className="mx-auto mt-8 flex w-fit max-w-full gap-4 overflow-x-auto px-4 pb-8 pt-8">
        {cards.map((card, index) => {
          const offset = index - middle;
          return (
            <motion.div
              key={card.id}
              data-reveal
              className="w-32 shrink-0 sm:w-36"
              initial={{ opacity: 0, y: 120, rotate: offset * 14, scale: 0.85 }}
              whileInView={{ opacity: 1, y: Math.abs(offset) * 6, rotate: offset * 3, scale: 1 }}
              whileHover={{ y: -14, rotate: 0, scale: 1.06, transition: { duration: 0.35, ease: EASE_OUT } }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.15 + index * 0.09 }}
            >
              {/* Подъём при наведении делает сама обёртка: у HoloCard остаются наклон и блик. */}
              <HoloCard lift={false}>
                <TarotCardFace card={card} locale={locale} className="card-glow w-full" />
              </HoloCard>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
