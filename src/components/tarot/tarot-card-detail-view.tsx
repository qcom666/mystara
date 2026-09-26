"use client";

import Link from "next/link";
import { CardDetailContent } from "@/components/tarot/card-detail-content";
import { FavoriteButton } from "@/components/tarot/favorite-button";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import type { TarotCard } from "@/modules/tarot/domain/types";

export function TarotCardDetailView({ card }: { card: TarotCard }) {
  const t = useTranslation();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Link href="/tarot/cards" className="text-sm text-silver-400 hover:text-gold-300">
        ← {t.tarotCardsPage.backToAllCards}
      </Link>
      <div className="mt-6">
        <CardDetailContent card={card} />
      </div>
      <div className="mt-4">
        <FavoriteButton type="CARD" targetId={card.id} />
      </div>
      <div className="mt-10 text-center">
        <Button asChild size="lg">
          <Link href="/reading">{t.tarotCardsPage.drawThisEnergyCta}</Link>
        </Button>
      </div>
    </div>
  );
}
