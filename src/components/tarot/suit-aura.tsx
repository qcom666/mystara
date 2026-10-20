"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { TarotCard } from "@/modules/tarot/domain/types";

type Aura = "major" | "wands" | "cups" | "swords" | "pentacles";

const auraOf = (card: TarotCard): Aura => (card.arcana === "major" ? "major" : (card.suit ?? "major"));

/** Ореол в цвете стихии масти: огонь, вода, воздух, земля; у старших арканов — золото со звёздным фиолетовым. */
const GLOW: Record<Aura, string> = {
  major: "radial-gradient(circle, rgba(212,175,55,0.38), rgba(139,92,246,0.2) 45%, transparent 70%)",
  wands: "radial-gradient(circle, rgba(251,146,60,0.4), rgba(212,175,55,0.16) 45%, transparent 70%)",
  cups: "radial-gradient(circle, rgba(139,92,246,0.4), rgba(56,189,248,0.16) 45%, transparent 70%)",
  swords: "radial-gradient(circle, rgba(203,213,225,0.32), rgba(125,211,252,0.15) 45%, transparent 70%)",
  pentacles: "radial-gradient(circle, rgba(212,175,55,0.4), rgba(52,211,153,0.15) 45%, transparent 70%)",
};

const PARTICLES = Array.from({ length: 14 }, (_, index) => index);
/** Позиции частиц — целочисленная «перетасовка» индекса, без случайности: сервер и браузер рисуют одно и то же. */
const lane = (index: number) => 8 + ((index * 37) % 84);

/** Жезлы — огонь: снизу вверх летят искры и гаснут. */
function Embers() {
  return PARTICLES.map((index) => (
    <motion.span
      key={index}
      className="absolute bottom-[14%] h-1.5 w-1.5 rounded-full bg-[rgb(253,186,116)] shadow-[0_0_10px_3px_rgba(251,146,60,0.7)]"
      style={{ left: `${lane(index)}%` }}
      initial={{ y: 0, x: 0, opacity: 0, scale: 1 }}
      animate={{ y: -230 - (index % 3) * 40, x: [0, index % 2 ? 16 : -16, 0], opacity: [0, 1, 0], scale: [1, 0.8, 0.3] }}
      transition={{ duration: 3 + (index % 4) * 0.6, repeat: Infinity, ease: "easeOut", delay: (index * 0.37) % 3.5 }}
    />
  ));
}

/** Кубки — вода: от карты расходятся круги и поднимаются пузырьки. */
function Ripples() {
  return (
    <>
      {[0, 1, 2].map((index) => (
        <motion.span
          key={`ring-${index}`}
          className="absolute left-1/2 top-1/2 -ml-24 -mt-24 h-48 w-48 rounded-full border border-violet-300/50"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: [0.6, 2.1], opacity: [0.7, 0] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: "easeOut", delay: index * 1.4 }}
        />
      ))}
      {PARTICLES.slice(0, 10).map((index) => (
        <motion.span
          key={`bubble-${index}`}
          className="absolute bottom-[10%] h-2.5 w-2.5 rounded-full border border-sky-200/70"
          style={{ left: `${lane(index)}%` }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: -240 - (index % 3) * 30, x: [0, index % 2 ? 8 : -8, 0], opacity: [0, 0.85, 0] }}
          transition={{ duration: 5 + (index % 3), repeat: Infinity, ease: "easeInOut", delay: (index * 0.6) % 5 }}
        />
      ))}
    </>
  );
}

/** Мечи — воздух: наискосок проносятся серебряные росчерки ветра. */
function Streaks() {
  return [0, 1, 2, 3, 4, 5].map((index) => (
    <motion.span
      key={index}
      className="absolute left-0 h-px w-1/2 bg-gradient-to-r from-transparent via-silver-100/80 to-transparent"
      style={{ top: `${14 + index * 14}%`, rotate: "-18deg" }}
      initial={{ x: "-120%", opacity: 0 }}
      animate={{ x: ["-120%", "230%"], opacity: [0, 1, 0] }}
      transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut", delay: index * 0.55 }}
    />
  ));
}

/** Пентакли — земля: медленно оседает золотая пыль, за картой вращается пентаграмма. */
function GoldDust() {
  return (
    <>
      <svg viewBox="0 0 200 200" className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 motion-safe:animate-[spin_80s_linear_infinite]">
        <circle cx="100" cy="100" r="92" fill="none" stroke="rgba(230,195,104,0.25)" strokeWidth="1" />
        <polygon points="100,12 152,172 16,73 184,73 48,172" fill="none" stroke="rgba(230,195,104,0.22)" strokeWidth="1" />
      </svg>
      {PARTICLES.map((index) => (
        <motion.span
          key={index}
          className="absolute top-[8%] h-1 w-1 rounded-full bg-gold-200 shadow-[0_0_8px_2px_rgba(243,218,143,0.6)]"
          style={{ left: `${lane(index)}%` }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: 260 + (index % 3) * 30, x: [0, index % 2 ? 10 : -10, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 5.5 + (index % 4) * 0.7, repeat: Infinity, ease: "easeInOut", delay: (index * 0.43) % 5 }}
        />
      ))}
    </>
  );
}

/** Старшие арканы — звёзды: вращаются лучи, по орбите мерцают звёзды. */
function StarRays() {
  return (
    <>
      <div className="absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 bg-[repeating-conic-gradient(from_0deg,rgba(243,218,143,0.18)_0deg_3deg,transparent_3deg_15deg)] [mask-image:radial-gradient(circle,black_15%,transparent_62%)] motion-safe:animate-[spin_60s_linear_infinite]" />
      <div className="absolute left-1/2 top-1/2 h-0 w-0 motion-safe:animate-[spin_50s_linear_infinite]">
        {PARTICLES.slice(0, 10).map((index) => (
          <span
            key={index}
            className="absolute -ml-1 -mt-1 h-2 w-2 rounded-full bg-gold-200 shadow-[0_0_10px_2px_rgba(243,218,143,0.6)] motion-safe:animate-twinkle"
            style={{ transform: `rotate(${index * 36}deg) translateY(-9.5rem)`, animationDelay: `${index * 0.4}s` }}
          />
        ))}
      </div>
    </>
  );
}

/**
 * Живая атмосфера за картой на её странице, своя у каждой масти: искры у Жезлов, круги по воде у Кубков,
 * росчерки ветра у Мечей, золотая пыль у Пентаклей и звёздные лучи у старших арканов. При «уменьшить
 * движение» остаётся только ореол.
 */
export function SuitAura({ card, className }: { card: TarotCard; className?: string }) {
  const aura = auraOf(card);
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0", className)}>
      <motion.div
        className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
        style={{ background: GLOW[aura] }}
        initial={{ opacity: 0.6, scale: 0.92 }}
        animate={{ opacity: [0.6, 1, 0.6], scale: [0.92, 1.08, 0.92] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Скрываем через CSS, а не условием: так разметка сервера и браузера совпадает при любой настройке. */}
      <div className="absolute inset-0 overflow-hidden [mask-image:radial-gradient(closest-side,black_55%,transparent)] motion-reduce:hidden">
        {aura === "wands" && <Embers />}
        {aura === "cups" && <Ripples />}
        {aura === "swords" && <Streaks />}
        {aura === "pentacles" && <GoldDust />}
        {aura === "major" && <StarRays />}
      </div>
    </div>
  );
}
