"use client";

import { TarotCardFace } from "@/components/tarot/tarot-card-face";
import { useLocale, useTranslation } from "@/lib/i18n";
import { getMajorArcana } from "@/modules/tarot/domain/deck";

const FEATURED_IDS = ["the-fool", "the-magician", "the-star", "the-sun", "the-world", "strength"];

export function CardShowcase() {
  const t = useTranslation();
  const { locale } = useLocale();
  const cards = getMajorArcana().filter((card) => FEATURED_IDS.includes(card.id));

  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-6xl text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-gold-400">{t.marketing.cardShowcase.eyebrow}</p>
        <h2 className="mt-3 font-display text-3xl text-silver-50">{t.marketing.cardShowcase.title}</h2>
        <p className="mx-auto mt-2 max-w-xl text-silver-400">{t.marketing.cardShowcase.body}</p>
      </div>
      <div className="mx-auto mt-10 flex max-w-6xl gap-4 overflow-x-auto px-4 pb-4">
        {cards.map((card) => (
          <div key={card.id} className="w-32 shrink-0 sm:w-36">
            <TarotCardFace card={card} locale={locale} className="card-glow w-full" />
          </div>
        ))}
      </div>
    </section>
  );
}
