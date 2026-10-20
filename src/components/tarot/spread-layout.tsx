"use client";

import { motion } from "framer-motion";
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

// Традиционная раскладка Кельтского креста: крест (корона/настоящее/вызов/основа, по бокам прошлое
// и ближайшее будущее) и колонка из четырёх карт «посох». Только этому раскладу нужна отдельная
// вёрстка: остальные хорошо читаются адаптивной сеткой, и новые расклады получают её автоматически
// без правок вёрстки.
const CELTIC_CROSS_TEMPLATE = ['". crown . outcome"', '"recentPast present nearFuture hopesFears"', '". challenge . external"', '". foundation . stance"'].join(
  " ",
);

/** Карта на своей позиции: при появлении на экране ложится по очереди, будто её выкладывают на стол. */
function PositionedCard({ drawn, renderCard, areaName, index }: { drawn: DrawnCard; renderCard: (d: DrawnCard) => ReactNode; areaName?: string; index: number }) {
  const { locale } = useLocale();
  return (
    <motion.div
      data-reveal
      style={areaName ? { gridArea: areaName } : undefined}
      className="flex flex-col items-center gap-2"
      initial={{ opacity: 0, y: 40, rotate: index % 2 === 0 ? -6 : 6, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 + index * 0.12 }}
    >
      {renderCard(drawn)}
      <span className="text-center text-xs text-silver-400 sm:text-sm">{getPositionLabel(drawn.position, locale)}</span>
    </motion.div>
  );
}

export function SpreadLayout({ spread, cards, renderCard }: SpreadLayoutProps) {
  if (spread.id === "celtic-cross") {
    const byPosition = new Map(cards.map((c) => [c.position.id, c]));
    return (
      <div>
        <div className="hidden gap-4 md:grid" style={{ gridTemplateAreas: CELTIC_CROSS_TEMPLATE, gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
          {spread.positions.map((position, index) => {
            const drawn = byPosition.get(position.id);
            return drawn ? <PositionedCard key={position.id} drawn={drawn} renderCard={renderCard} areaName={position.id} index={index} /> : null;
          })}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:hidden">
          {cards.map((drawn, index) => (
            <PositionedCard key={drawn.position.id} drawn={drawn} renderCard={renderCard} index={index} />
          ))}
        </div>
      </div>
    );
  }

  if (spread.cardCount === 1) {
    const only = cards[0];
    return <div className="mx-auto max-w-[240px]">{only && <PositionedCard drawn={only} renderCard={renderCard} index={0} />}</div>;
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6",
        spread.cardCount === 4 && "md:grid-cols-4",
        spread.cardCount >= 5 && "md:grid-cols-5",
      )}
    >
      {cards.map((drawn, index) => (
        <PositionedCard key={drawn.position.id} drawn={drawn} renderCard={renderCard} index={index} />
      ))}
    </div>
  );
}
