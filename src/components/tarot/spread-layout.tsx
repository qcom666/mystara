"use client";

import { animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { type ReactNode, type RefObject, useLayoutEffect, useRef } from "react";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getPositionLabel } from "@/modules/tarot/domain/spreads.data";
import type { DrawnCard, TarotSpread } from "@/modules/tarot/domain/types";

interface SpreadLayoutProps {
  spread: TarotSpread;
  cards: DrawnCard[];
  renderCard: (drawn: DrawnCard) => ReactNode;
  /** Колода, из которой карты раздаются по очереди (стол расклада). Без неё карты появляются при прокрутке. */
  dealFrom?: RefObject<HTMLElement | null>;
}

/** Раздача: колода появляется, затем карты по очереди летят из неё на свои места. */
export const DEAL_START_S = 0.35;
export const DEAL_STAGGER_S = 0.14;
export const DEAL_FLIGHT_S = 0.9;

// Традиционная раскладка Кельтского креста: крест (корона/настоящее/вызов/основа, по бокам прошлое
// и ближайшее будущее) и колонка из четырёх карт «посох». Только этому раскладу нужна отдельная
// вёрстка: остальные хорошо читаются адаптивной сеткой, и новые расклады получают её автоматически
// без правок вёрстки.
const CELTIC_CROSS_TEMPLATE = ['". crown . outcome"', '"recentPast present nearFuture hopesFears"', '". challenge . external"', '". foundation . stance"'].join(
  " ",
);

interface PositionedCardProps {
  drawn: DrawnCard;
  renderCard: (d: DrawnCard) => ReactNode;
  areaName?: string;
  index: number;
  dealFrom?: RefObject<HTMLElement | null>;
}

/**
 * Карта, которую сдают из колоды: перед первой отрисовкой её сдвигают в точку колоды (уменьшенной и
 * развёрнутой), затем она пружиной летит на своё место. Меряем неподвижную ячейку, а не саму карту:
 * у карты уже есть сдвиг, и повторный замер (StrictMode в разработке) дал бы ноль.
 */
function DealtCard({ drawn, renderCard, areaName, index, dealFrom }: PositionedCardProps & { dealFrom: RefObject<HTMLElement | null> }) {
  const { locale } = useLocale();
  const reduceMotion = useReducedMotion();
  const slotRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useMotionValue(0);
  const scale = useMotionValue(1);
  const opacity = useMotionValue(0);
  const delay = DEAL_START_S + index * DEAL_STAGGER_S;

  useLayoutEffect(() => {
    const slot = slotRef.current?.getBoundingClientRect();
    const origin = dealFrom.current?.getBoundingClientRect();
    // Скрытая раскладка (у Кельтского креста своя для узкого экрана) имеет нулевой размер: её не сдаём.
    if (reduceMotion || !slot || !origin || slot.width === 0) {
      opacity.set(1);
      return;
    }
    x.set(origin.left + origin.width / 2 - (slot.left + slot.width / 2));
    y.set(origin.top + origin.height / 2 - (slot.top + slot.height / 2));
    scale.set(origin.width / slot.width);
    rotate.set(index % 2 === 0 ? -16 : 16);
    opacity.set(0);
    const spring = { type: "spring", stiffness: 120, damping: 17, delay } as const;
    const controls = [
      animate(x, 0, spring),
      animate(y, 0, spring),
      animate(scale, 1, spring),
      animate(rotate, 0, { ...spring, stiffness: 80 }),
      animate(opacity, 1, { duration: 0.12, delay }),
    ];
    return () => controls.forEach((control) => control.stop());
    // Раздача — один раз при появлении стола.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={areaName ? { gridArea: areaName } : undefined} className="flex flex-col items-center gap-2">
      <div ref={slotRef} className="w-full">
        <motion.div style={{ x, y, rotate, scale, opacity }}>{renderCard(drawn)}</motion.div>
      </div>
      <motion.span
        className="text-center text-xs text-silver-400 sm:text-sm"
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: delay + DEAL_FLIGHT_S * 0.6 }}
      >
        {getPositionLabel(drawn.position, locale)}
      </motion.span>
    </div>
  );
}

/** Карта на своей позиции: при появлении на экране ложится по очереди, будто её выкладывают на стол. */
function PositionedCard({ drawn, renderCard, areaName, index, dealFrom }: PositionedCardProps) {
  const { locale } = useLocale();
  if (dealFrom) return <DealtCard drawn={drawn} renderCard={renderCard} areaName={areaName} index={index} dealFrom={dealFrom} />;
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

export function SpreadLayout({ spread, cards, renderCard, dealFrom }: SpreadLayoutProps) {
  if (spread.id === "celtic-cross") {
    const byPosition = new Map(cards.map((c) => [c.position.id, c]));
    return (
      <div>
        <div className="hidden gap-4 md:grid" style={{ gridTemplateAreas: CELTIC_CROSS_TEMPLATE, gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
          {spread.positions.map((position, index) => {
            const drawn = byPosition.get(position.id);
            return drawn ? <PositionedCard key={position.id} drawn={drawn} renderCard={renderCard} areaName={position.id} index={index} dealFrom={dealFrom} /> : null;
          })}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:hidden">
          {cards.map((drawn, index) => (
            <PositionedCard key={drawn.position.id} drawn={drawn} renderCard={renderCard} index={index} dealFrom={dealFrom} />
          ))}
        </div>
      </div>
    );
  }

  if (spread.cardCount === 1) {
    const only = cards[0];
    return <div className="mx-auto max-w-[240px]">{only && <PositionedCard drawn={only} renderCard={renderCard} index={0} dealFrom={dealFrom} />}</div>;
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
        <PositionedCard key={drawn.position.id} drawn={drawn} renderCard={renderCard} index={index} dealFrom={dealFrom} />
      ))}
    </div>
  );
}
