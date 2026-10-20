"use client";

import { motion, useReducedMotion, useSpring } from "framer-motion";
import { type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Скругление лица карты в долях её размера (rx 16 в рамке 240×400): блик повторяет форму карты. */
const CARD_RADIUS = "6.7% / 4%";

/**
 * Карта «в руке»: наклоняется за курсором, по ней бегут блик и голографический перелив, при наведении она
 * приподнимается. Положение курсора пишется в CSS-переменные элемента, поэтому движение мыши не перерисовывает
 * React. На сенсорных экранах и при «уменьшить движение» наклона нет, `disabled` выключает эффект (например,
 * у карты рубашкой вверх), `lift={false}` — подъём при наведении, если его уже делает обёртка.
 */
export function HoloCard({
  children,
  className,
  disabled = false,
  lift = true,
  tilt = 12,
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  lift?: boolean;
  tilt?: number;
}) {
  const reduceMotion = useReducedMotion();
  const rotateX = useSpring(0, { stiffness: 220, damping: 20 });
  const rotateY = useSpring(0, { stiffness: 220, damping: 20 });
  const active = !disabled && !reduceMotion;

  function handleMove(event: PointerEvent<HTMLDivElement>) {
    if (!active || event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    rotateY.set((px - 0.5) * tilt * 2);
    rotateX.set(-(py - 0.5) * tilt * 2);
    event.currentTarget.style.setProperty("--glare-x", `${(px * 100).toFixed(1)}%`);
    event.currentTarget.style.setProperty("--glare-y", `${(py * 100).toFixed(1)}%`);
  }

  function handleLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.div
      className={cn("group/holo relative [transform-style:preserve-3d]", className)}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      whileHover={active && lift ? { scale: 1.04, y: -6 } : undefined}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {children}
      {/* Блики скрываются через CSS при «уменьшить движение»: условие в разметке разошлось бы с сервером. */}
      {!disabled && (
        <>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 mix-blend-screen transition-opacity duration-300 group-hover/holo:opacity-100 motion-reduce:hidden"
            style={{
              borderRadius: CARD_RADIUS,
              background: "radial-gradient(circle at var(--glare-x, 50%) var(--glare-y, 30%), rgba(255, 247, 220, 0.42), rgba(255, 247, 220, 0.08) 28%, transparent 55%)",
            }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 mix-blend-color-dodge transition-opacity duration-300 group-hover/holo:opacity-60 motion-reduce:hidden"
            style={{
              borderRadius: CARD_RADIUS,
              backgroundImage: "linear-gradient(115deg, transparent 32%, rgba(196, 176, 251, 0.28) 44%, rgba(243, 218, 143, 0.32) 51%, rgba(125, 211, 252, 0.2) 58%, transparent 70%)",
              backgroundSize: "260% 260%",
              backgroundPosition: "var(--glare-x, 50%) var(--glare-y, 50%)",
            }}
          />
        </>
      )}
    </motion.div>
  );
}
