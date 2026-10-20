import type { TargetAndTransition } from "framer-motion";
import { EASE_OUT } from "@/components/motion/reveal";

/**
 * Общая анимация колоды из семи карт (карта дня, перетасовка в раскладах): шесть карт под верхней и сама
 * верхняя. idle — стопка, shuffling — карты разлетаются веером и собираются (круг повторяется),
 * drawing — нижние карты улетают вниз, а верхняя выходит вперёд, revealed — верхняя парит.
 */
export type DeckPhase = "idle" | "shuffling" | "drawing" | "revealed";

/** Один круг тасования. */
export const SHUFFLE_MS = 1700;

/** Шесть карт под верхней: в веере они встают по три с каждой стороны от неё. */
export const UNDER = [0, 1, 2, 3, 4, 5];
const fanOffset = (index: number) => (index < 3 ? index - 3 : index - 2);

/** Порядок наложения карт под верхней: ближние к центру лежат выше. */
export const underCardZ = (index: number) => (index < 3 ? index : 5 - index);

/** Положение карты из-под верхней: в стопке, на круге тасования, улетая вниз при выходе верхней карты. */
export function underCardTarget(index: number, phase: DeckPhase): TargetAndTransition {
  const offset = fanOffset(index);
  const stack = { x: offset * 1.5, y: 12 - Math.abs(offset) * 2, rotate: offset * 1.6 };
  if (phase === "idle") return { ...stack, opacity: 1, scale: 1, transition: { duration: 0.5, ease: EASE_OUT } };
  if (phase === "shuffling") {
    const fan = { x: offset * 26, y: Math.abs(offset) * 9 - 26, rotate: offset * 15 };
    return {
      x: [stack.x, fan.x, -fan.x * 0.4, stack.x],
      y: [stack.y, fan.y, stack.y + 8, stack.y],
      rotate: [stack.rotate, fan.rotate, -fan.rotate * 0.35, stack.rotate],
      opacity: 1,
      scale: 1,
      transition: { duration: SHUFFLE_MS / 1000, times: [0, 0.4, 0.72, 1], ease: "easeInOut", repeat: Infinity, delay: Math.abs(offset) * 0.03 },
    };
  }
  return {
    x: offset * 40,
    y: 170 + Math.abs(offset) * 14,
    rotate: offset * 24,
    opacity: 0,
    scale: 0.82,
    transition: { duration: 0.65, ease: [0.55, 0, 0.75, 0.3], delay: (3 - Math.abs(offset)) * 0.04 },
  };
}

/** Верхняя карта: дышит в стопке, подпрыгивает при тасовании, выходит вперёд и потом парит. */
export function topCardTarget(phase: DeckPhase): TargetAndTransition {
  if (phase === "idle") return { y: 0, scale: 1, rotate: 0, transition: { duration: 0.5, ease: EASE_OUT } };
  if (phase === "shuffling") {
    return { y: [0, -48, 6, 0], scale: [1, 1.05, 1, 1], rotate: [0, -3, 2, 0], transition: { duration: SHUFFLE_MS / 1000, times: [0, 0.4, 0.72, 1], ease: "easeInOut", repeat: Infinity } };
  }
  if (phase === "drawing") return { y: -24, scale: 1.16, rotate: 0, transition: { type: "spring", stiffness: 120, damping: 14 } };
  return { y: [-24, -36, -24], scale: 1.16, rotate: 0, transition: { y: { duration: 5, ease: "easeInOut", repeat: Infinity } } };
}
