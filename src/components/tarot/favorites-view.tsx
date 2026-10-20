"use client";

import Link from "@/components/shared/localized-link";
import { FavoriteButton } from "@/components/tarot/favorite-button";
import { HoloCard } from "@/components/tarot/holo-card";
import { TarotCardFace } from "@/components/tarot/tarot-card-face";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useLocale, useTranslation } from "@/lib/i18n";
import { getCardName } from "@/modules/tarot/domain/deck";
import { getSpreadDescription, getSpreadName } from "@/modules/tarot/domain/spreads.data";
import type { TarotCard, TarotSpread } from "@/modules/tarot/domain/types";

export type FavoritesData =
  | { status: "unconfigured" }
  | { status: "ready"; favoriteCards: TarotCard[]; favoriteSpreads: TarotSpread[] };

export function FavoritesView({ data }: { data: FavoritesData }) {
  const t = useTranslation();
  const { locale } = useLocale();

  if (data.status === "unconfigured") {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <GlassPanel>
          <h1 className="font-display text-2xl text-silver-100">{t.favoritesPage.favoritesUnavailableTitle}</h1>
          <p className="mt-3 text-sm text-silver-400">{t.readingsPage.dbNotConfiguredBody}</p>
        </GlassPanel>
      </div>
    );
  }

  const { favoriteCards, favoriteSpreads } = data;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="font-display text-3xl text-silver-50">{t.favoritesPage.title}</h1>

      <section className="mt-10">
        <h2 className="font-display text-xl text-silver-100">{t.favoritesPage.cardsTitle}</h2>
        {favoriteCards.length === 0 ? (
          <p className="mt-3 text-sm text-silver-400">
            {t.favoritesPage.noFavoriteCardsPrefix}{" "}
            <Link href="/tarot/cards" className="text-gold-300 hover:underline">
              {t.favoritesPage.cardMeaningsLinkLabel}
            </Link>{" "}
            {t.favoritesPage.noFavoriteCardsSuffix}
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
            {favoriteCards.map((card) => (
              <div key={card.id} className="text-center">
                <Link href={`/tarot/cards/${card.id}`}>
                  <HoloCard>
                    <TarotCardFace card={card} locale={locale} className="w-full" />
                  </HoloCard>
                </Link>
                <p className="mt-2 text-xs text-silver-400">{getCardName(card, locale)}</p>
                <div className="mt-1 flex justify-center">
                  <FavoriteButton type="CARD" targetId={card.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl text-silver-100">{t.favoritesPage.spreadsTitle}</h2>
        {favoriteSpreads.length === 0 ? (
          <p className="mt-3 text-sm text-silver-400">
            {t.favoritesPage.noFavoriteSpreadsPrefix}{" "}
            <Link href="/tarot/spreads" className="text-gold-300 hover:underline">
              {t.favoritesPage.allSpreadsLinkLabel}
            </Link>{" "}
            {t.favoritesPage.noFavoriteSpreadsSuffix}
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {favoriteSpreads.map((spread) => (
              <GlassPanel key={spread.id}>
                <h3 className="font-display text-lg text-silver-100">{getSpreadName(spread, locale)}</h3>
                <p className="mt-1 text-sm text-silver-400">{getSpreadDescription(spread, locale)}</p>
                <div className="mt-3 flex items-center gap-3">
                  <Button asChild size="sm">
                    <Link href={`/reading/${spread.id}`}>{t.favoritesPage.startReadingCta}</Link>
                  </Button>
                  <FavoriteButton type="SPREAD" targetId={spread.id} />
                </div>
              </GlassPanel>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
