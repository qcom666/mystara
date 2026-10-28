"use client";

import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import { ZodiacWheel } from "@/components/motion/effects";
import { EASE_OUT } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import { SHUFFLE_MS, topCardTarget, UNDER, underCardTarget, underCardZ } from "./deck-motion";
import { TarotCardBack } from "./tarot-card-back";

interface DeckShuffleProps {
  shuffling: boolean;
  className?: string;
}

/**
 * Колода перед раскладом: парит в ореоле, вокруг пульсируют кольца и вращается зодиакальный круг. Во время
 * перетасовки карты разлетаются веером и собираются, а круг проворачивается быстрее.
 */
export function DeckShuffle({ shuffling, className }: DeckShuffleProps) {
  const phase = shuffling ? "shuffling" : "idle";

  return (
    <div className={cn("relative mx-auto flex h-[22rem] w-full max-w-md items-center justify-center sm:h-[26rem]", className)}>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 sm:h-[28rem] sm:w-[28rem]"
        initial={{ opacity: 0, scale: 0.7, rotate: -40 }}
        animate={{ opacity: shuffling ? 0.95 : 0.7, scale: shuffling ? 1.08 : 1, rotate: shuffling ? 180 : 0 }}
        transition={{ duration: shuffling ? (SHUFFLE_MS / 1000) * 1.2 : 1.4, ease: EASE_OUT }}
      >
        <ZodiacWheel className="relative h-full w-full" />
      </motion.div>

      {/* Ореол, кольца и парение — CSS-круги (globals.css), без работы главного потока. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-500/25 blur-3xl motion-safe:animate-glow-pulse"
        style={
          shuffling
            ? ({ "--glow-min": 0.6, "--glow-max": 1, animationDuration: "1.2s" } as CSSProperties)
            : ({ "--glow-min": 0.3, "--glow-max": 0.6, animationDuration: "4.5s" } as CSSProperties)
        }
      />

      {!shuffling && (
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2">
          {[0, 1.2].map((delay) => (
            <span
              key={delay}
              className="absolute -ml-28 -mt-28 h-56 w-56 rounded-full border border-gold-400/40 opacity-0 motion-safe:animate-ring-pulse"
              style={{ "--ring-end": 1.6, animationDelay: `${delay}s` } as CSSProperties}
            />
          ))}
        </div>
      )}

      <motion.div
        className={cn("relative z-10 aspect-[3/5] w-36 sm:w-44", !shuffling && "motion-safe:animate-bob")}
        initial={{ opacity: 0, y: 40, scale: 0.85 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={shuffling ? { duration: 0.4, ease: EASE_OUT } : { opacity: { duration: 0.6 }, scale: { duration: 0.7, ease: EASE_OUT }, y: { duration: 0.7, ease: EASE_OUT } }}
      >
        {UNDER.map((index) => (
          <motion.div
            key={index}
            className="absolute inset-0 origin-[50%_140%]"
            style={{ zIndex: underCardZ(index) }}
            initial={false}
            animate={underCardTarget(index, phase)}
          >
            <TarotCardBack className="h-full w-full drop-shadow-xl" />
          </motion.div>
        ))}
        <motion.div className="absolute inset-0 z-10" initial={false} animate={topCardTarget(phase)}>
          <TarotCardBack className="h-full w-full drop-shadow-2xl" />
        </motion.div>
      </motion.div>
    </div>
  );
}
