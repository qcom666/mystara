"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { ScrollProgress } from "./reveal";

/**
 * Обёртка главной страницы: полоса прогресса прокрутки и общая настройка анимаций. reducedMotion="user":
 * если в системе включено «уменьшить движение», сдвиги и повороты отключаются, остаётся только плавное
 * появление.
 */
export function LandingMotion({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ScrollProgress />
      {children}
    </MotionConfig>
  );
}
