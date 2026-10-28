"use client";

import { motion, useReducedMotion } from "framer-motion";
import { type CSSProperties, useState } from "react";
import { EASE_OUT } from "@/components/motion/reveal";
import { useLocale, useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getCardName } from "@/modules/tarot/domain/deck";
import type { Orientation, TarotCard } from "@/modules/tarot/domain/types";
import { HoloCard } from "./holo-card";
import { TarotCardBack } from "./tarot-card-back";
import { TarotCardFace } from "./tarot-card-face";

interface FlippableCardProps {
  card: TarotCard;
  orientation: Orientation;
  revealed: boolean;
  onReveal?: () => void;
  interactive?: boolean;
  className?: string;
}

const CARD_RADIUS = "rounded-[6.7%/4%]";
const SPARKS = Array.from({ length: 12 }, (_, index) => index);

/** Вспышка в момент, когда карта легла лицом: свет, ударная волна по контуру и искры. */
function FlipBurst() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-10">
      <motion.span
        className={cn("absolute inset-0 bg-[radial-gradient(circle,rgba(255,240,190,0.75),transparent_65%)]", CARD_RADIUS)}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.9, 0] }}
        transition={{ duration: 0.8, delay: 0.3, times: [0, 0.3, 1] }}
      />
      <motion.span
        className={cn("absolute inset-0 border-2 border-gold-200 shadow-[0_0_24px_rgba(243,218,143,0.7)]", CARD_RADIUS)}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: [0, 1, 0], scale: [0.92, 1, 1.22] }}
        transition={{ duration: 0.9, delay: 0.36, ease: [0.16, 1, 0.3, 1] }}
      />
      {SPARKS.map((index) => {
        const angle = (index / SPARKS.length) * Math.PI * 2;
        const distance = 48 + (index % 3) * 12;
        return (
          <motion.span
            key={index}
            className="absolute left-1/2 top-1/2 -ml-[3px] -mt-[3px] h-1.5 w-1.5 rounded-full bg-gold-200 shadow-[0_0_8px_2px_rgba(243,218,143,0.8)]"
            initial={{ x: 0, y: 0, opacity: 0, scale: 1 }}
            animate={{ x: Math.cos(angle) * distance * 1.4, y: Math.sin(angle) * distance * 2, opacity: [0, 1, 0], scale: 0.3 }}
            transition={{ duration: 0.9, delay: 0.38, ease: [0.16, 1, 0.3, 1] }}
          />
        );
      })}
    </span>
  );
}

/**
 * Карта, которую открывают касанием. Рубашкой вверх она мерцает золотой рамкой, зовя нажать; при перевороте
 * подпрыгивает и вспыхивает, а открытая наклоняется за курсором и блестит (HoloCard). Карта, которая
 * монтируется уже открытой, сразу показывается лицом: без переворота и вспышки.
 */
export function FlippableCard({ card, orientation, revealed, onReveal, interactive = true, className }: FlippableCardProps) {
  const t = useTranslation();
  const { locale } = useLocale();
  const prefersReducedMotion = useReducedMotion();
  // Вспышка — только для карты, которую открыли у человека на глазах.
  const [revealedAtMount] = useState(revealed);

  function handleClick() {
    if (!revealed && interactive) {
      onReveal?.();
    }
  }

  const label = revealed ? `${getCardName(card, locale)}${orientation === "reversed" ? " (reversed)" : ""}` : t.reading.faceDownCard;

  const flipCard = (
    <HoloCard disabled={!revealed} className="h-full w-full">
      <motion.div
        className="relative h-full w-full"
        initial={false}
        animate={revealed ? { y: [0, -18, 0], scale: [1, 1.08, 1] } : { y: 0, scale: 1 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.9, times: [0, 0.45, 1], ease: EASE_OUT }}
      >
        <motion.div
          className="relative h-full w-full [transform-style:preserve-3d]"
          style={{ transformPerspective: 1200 }}
          // `initial={false}`: карта, которая монтируется уже открытой (экран результата, детали истории),
          // сразу стоит лицом, а не проигрывает переворот при каждом монтировании.
          initial={false}
          animate={{ rotateY: revealed ? 180 : 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="absolute inset-0 [backface-visibility:hidden]">
            <TarotCardBack label={t.reading.cardBackLabel} className="h-full w-full drop-shadow-lg" />
          </div>
          <div
            className={cn(
              "absolute inset-0 [backface-visibility:hidden]",
              orientation === "reversed" ? "[transform:rotateY(180deg)_rotate(180deg)]" : "[transform:rotateY(180deg)]",
            )}
          >
            <TarotCardFace card={card} orientation={orientation} locale={locale} className="card-glow h-full w-full drop-shadow-lg" />
          </div>
        </motion.div>
      </motion.div>

      {/* Мерцающая рамка — CSS-круг: на столе с десятью картами framer считал бы десять циклов в каждом кадре. */}
      {interactive && !revealed && (
        <span
          aria-hidden="true"
          className={cn("pointer-events-none absolute -inset-1 border border-gold-300/70 opacity-0 shadow-[0_0_26px_-4px_rgba(243,218,143,0.65)] motion-safe:animate-glow-pulse", CARD_RADIUS)}
          style={{ "--glow-min": 0.1, "--glow-max": 0.75, "--glow-scale-min": 1, "--glow-scale-max": 1, animationDuration: "2.4s" } as CSSProperties}
        />
      )}
      {revealed && !revealedAtMount && !prefersReducedMotion && <FlipBurst />}
    </HoloCard>
  );

  const sharedClassName = cn("group relative block aspect-[3/5] w-full", className);

  // Неинтерактивные карты (например, уже открытые на экране результата, где детали открывает
  // *другая*, внешняя кнопка) сами не должны быть <button>: вложенный <button> в <button> —
  // невалидный HTML и вызывает ошибку гидратации. В таком случае рендерим обычный <div>.
  if (!interactive) {
    return (
      <div aria-hidden="true" className={sharedClassName}>
        {flipCard}
      </div>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      // Не `disabled`: у отключённой кнопки браузеры глушат события мыши, и открытая карта не наклонялась бы.
      aria-disabled={revealed}
      tabIndex={revealed ? -1 : 0}
      aria-label={label}
      className={cn(sharedClassName, "focus-ring rounded-xl", revealed ? "cursor-default" : "cursor-pointer")}
      whileHover={!revealed && !prefersReducedMotion ? { y: -8, rotate: -1.5 } : undefined}
      whileTap={!revealed && !prefersReducedMotion ? { scale: 0.96 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {flipCard}
    </motion.button>
  );
}
