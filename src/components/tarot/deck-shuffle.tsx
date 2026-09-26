"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TarotCardBack } from "./tarot-card-back";

interface DeckShuffleProps {
  shuffling: boolean;
  className?: string;
}

const STACK = [0, 1, 2, 3, 4];

export function DeckShuffle({ shuffling, className }: DeckShuffleProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={cn("relative mx-auto aspect-[3/5] w-40 sm:w-48", className)}>
      {STACK.map((i) => {
        const resting = { x: i * 2, y: -i * 2, rotate: 0 };
        const shuffleKeyframes = { x: [i * 2, -8 - i, 6 + i, i * 2], y: [-i * 2, 3, -5, -i * 2], rotate: [-3, 4, -4, 0] };
        return (
          <motion.div
            key={i}
            className="absolute inset-0"
            style={{ zIndex: STACK.length - i }}
            initial={false}
            animate={prefersReducedMotion || !shuffling ? resting : shuffleKeyframes}
            transition={
              shuffling && !prefersReducedMotion
                ? { duration: 0.9, repeat: Infinity, ease: "easeInOut", delay: i * 0.05 }
                : { duration: 0.4, ease: "easeOut" }
            }
          >
            <TarotCardBack className="h-full w-full drop-shadow-xl" />
          </motion.div>
        );
      })}
    </div>
  );
}
