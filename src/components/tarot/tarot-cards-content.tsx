"use client";

import Link from "@/components/shared/localized-link";
import { TarotCardFace } from "@/components/tarot/tarot-card-face";
import { useLocale, useTranslation, type Locale } from "@/lib/i18n";
import { getAllCards, getCardName } from "@/modules/tarot/domain/deck";
import type { TarotCard } from "@/modules/tarot/domain/types";
import { SplitWords } from "@/components/motion/reveal";
import type { CSSProperties } from "react";

const SUITS = ["wands", "cups", "swords", "pentacles"] as const;

function CardTile({ card, locale, index }: { card: TarotCard; locale: Locale; index: number }) {
  return (
    <Link
      href={`/tarot/cards/${card.id}`}
      className="focus-ring scroll-reveal-step group block"
      style={{ "--reveal-index": index % 7 } as CSSProperties}
    >
      <TarotCardFace card={card} locale={locale} className="w-full transition-[translate,box-shadow] duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_0_40px_-10px_rgba(212,175,55,0.6)]" />
      <p className="mt-2 text-center text-xs text-silver-400 group-hover:text-gold-300">{getCardName(card, locale)}</p>
    </Link>
  );
}

function Section({ title, cards, locale }: { title: string; cards: readonly TarotCard[]; locale: Locale }) {
  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl text-silver-100">{title}</h2>
      <div className="mt-5 grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7">
        {cards.map((card, index) => (
          <CardTile key={card.id} card={card} locale={locale} index={index} />
        ))}
      </div>
    </section>
  );
}

export function TarotCardsContent() {
  const t = useTranslation();
  const { locale } = useLocale();
  const all = getAllCards();
  const major = all.filter((card) => card.arcana === "major");

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-display text-3xl text-silver-50 sm:text-4xl"><SplitWords text={t.tarotCardsPage.title} immediate delay={0.1} /></h1>
      <p className="mt-3 max-w-2xl text-silver-400">{t.tarotCardsPage.subtitle}</p>

      <Section title={t.reading.majorArcana} cards={major} locale={locale} />
      {SUITS.map((suit) => (
        <Section
          key={suit}
          title={t.reading.suits[suit]}
          cards={all.filter((card) => card.suit === suit)}
          locale={locale}
        />
      ))}
    </div>
  );
}
