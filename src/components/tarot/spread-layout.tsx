"use client";

import type { ReactNode } from "react";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getPositionLabel } from "@/modules/tarot/domain/spreads.data";
import type { DrawnCard, TarotSpread } from "@/modules/tarot/domain/types";

interface SpreadLayoutProps {
  spread: TarotSpread;
  cards: DrawnCard[];
  renderCard: (drawn: DrawnCard) => ReactNode;
}

// Traditional Celtic Cross arrangement: a cross (crown/present/challenge/foundation,
// flanked by recentPast/nearFuture) plus a four-card "staff" column. This is the one
// spread that earns a bespoke layout — everything else reads fine as a responsive
// grid, which is also what any *future* spread gets automatically (see
// PROJECT_ARCHITECTURE.md §5: new spreads never require layout code changes).
const CELTIC_CROSS_TEMPLATE = ['". crown . outcome"', '"recentPast present nearFuture hopesFears"', '". challenge . external"', '". foundation . stance"'].join(
  " ",
);

function PositionedCard({ drawn, renderCard, areaName }: { drawn: DrawnCard; renderCard: (d: DrawnCard) => ReactNode; areaName?: string }) {
  const { locale } = useLocale();
  return (
    <div style={areaName ? { gridArea: areaName } : undefined} className="flex flex-col items-center gap-2">
      {renderCard(drawn)}
      <span className="text-center text-xs text-silver-400 sm:text-sm">{getPositionLabel(drawn.position, locale)}</span>
    </div>
  );
}

export function SpreadLayout({ spread, cards, renderCard }: SpreadLayoutProps) {
  if (spread.id === "celtic-cross") {
    const byPosition = new Map(cards.map((c) => [c.position.id, c]));
    return (
      <div>
        <div className="hidden gap-4 md:grid" style={{ gridTemplateAreas: CELTIC_CROSS_TEMPLATE, gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
          {spread.positions.map((position) => {
            const drawn = byPosition.get(position.id);
            return drawn ? <PositionedCard key={position.id} drawn={drawn} renderCard={renderCard} areaName={position.id} /> : null;
          })}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:hidden">
          {cards.map((drawn) => (
            <PositionedCard key={drawn.position.id} drawn={drawn} renderCard={renderCard} />
          ))}
        </div>
      </div>
    );
  }

  if (spread.cardCount === 1) {
    const only = cards[0];
    return <div className="mx-auto max-w-[240px]">{only && <PositionedCard drawn={only} renderCard={renderCard} />}</div>;
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6",
        spread.cardCount === 4 && "md:grid-cols-4",
        spread.cardCount >= 5 && "md:grid-cols-5",
      )}
    >
      {cards.map((drawn) => (
        <PositionedCard key={drawn.position.id} drawn={drawn} renderCard={renderCard} />
      ))}
    </div>
  );
}
