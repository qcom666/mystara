"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useLocale, useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getCardName } from "@/modules/tarot/domain/deck";
import type { Orientation, TarotCard } from "@/modules/tarot/domain/types";
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

export function FlippableCard({ card, orientation, revealed, onReveal, interactive = true, className }: FlippableCardProps) {
  const t = useTranslation();
  const { locale } = useLocale();
  const prefersReducedMotion = useReducedMotion();

  function handleClick() {
    if (!revealed && interactive) {
      onReveal?.();
    }
  }

  const label = revealed ? `${getCardName(card, locale)}${orientation === "reversed" ? " (reversed)" : ""}` : t.reading.faceDownCard;

  const flipCard = (
    <motion.div
      className="relative h-full w-full [transform-style:preserve-3d]"
      // `initial={false}` matters here: a card that mounts already
      // `revealed` (result screen, history detail) should snap straight to
      // its final state, not replay the flip-in animation on every mount —
      // letting it "animate in" every time also left it visibly stuck
      // mid-flip when the animation got interrupted by a backgrounded tab.
      // A card that starts face-down and later gets revealed by a click
      // still animates normally, since that's a post-mount prop change.
      initial={false}
      animate={{ rotateY: revealed ? 180 : 0 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute inset-0 [backface-visibility:hidden]">
        <TarotCardBack
          label={t.reading.cardBackLabel}
          className={cn("h-full w-full drop-shadow-lg transition-transform duration-300", interactive && !revealed && "group-hover:scale-[1.02]")}
        />
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
  );

  const sharedClassName = cn("group relative block aspect-[3/5] w-full [perspective:1200px]", className);

  // Non-interactive cards (e.g. the already-revealed result screen, where a
  // *different* outer button opens a detail dialog) must not themselves be a
  // <button> — nesting <button> inside <button> is invalid HTML and triggers
  // a hydration error. Render a plain <div> in that case.
  if (!interactive) {
    return (
      <div aria-hidden="true" className={sharedClassName}>
        {flipCard}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={revealed}
      aria-label={label}
      className={cn(sharedClassName, "focus-ring disabled:cursor-default", !revealed && "cursor-pointer")}
    >
      {flipCard}
    </button>
  );
}
