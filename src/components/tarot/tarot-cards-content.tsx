"use client";

import Link from "next/link";
import { TarotCardFace } from "@/components/tarot/tarot-card-face";
import { useLocale, useTranslation, type Locale } from "@/lib/i18n";
import { getAllCards, getCardName } from "@/modules/tarot/domain/deck";
import type { TarotCard } from "@/modules/tarot/domain/types";

const SUITS = ["wands", "cups", "swords", "pentacles"] as const;

function CardTile({ card, locale }: { card: TarotCard; locale: Locale }) {
  return (
    <Link href={`/tarot/cards/${card.id}`} className="focus-ring group block">
      <TarotCardFace card={card} locale={locale} className="w-full transition-transform duration-200 group-hover:-translate-y-1" />
      <p className="mt-2 text-center text-xs text-silver-400 group-hover:text-gold-300">{getCardName(card, locale)}</p>
    </Link>
  );
}

function Section({ title, cards, locale }: { title: string; cards: readonly TarotCard[]; locale: Locale }) {
  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl text-silver-100">{title}</h2>
      <div className="mt-5 grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7">
        {cards.map((card) => (
          <CardTile key={card.id} card={card} locale={locale} />
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
      <h1 className="font-display text-3xl text-silver-50 sm:text-4xl">{t.tarotCardsPage.title}</h1>
      <p className="mt-3 max-w-2xl text-silver-400">{t.tarotCardsPage.subtitle}</p>

      <Section title={t.reading.majorArcana} cards={major} locale={locale} />
      {SUITS.map((suit) => (
        <Section
          key={suit}
          title={`${suit[0].toUpperCase()}${suit.slice(1)}`}
          cards={all.filter((card) => card.suit === suit)}
          locale={locale}
        />
      ))}
    </div>
  );
}
