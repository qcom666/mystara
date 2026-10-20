"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Переход при смене страницы: новая страница мягко поднимается и проявляется. template, в отличие от
 * layout, создаётся заново при каждом переходе, поэтому анимация играет на любой странице сайта.
 * Анимируются только opacity и сдвиг: после окончания framer снимает transform, и закреплённые (fixed)
 * элементы страницы позиционируются как обычно. Без JavaScript страница видна сразу (data-page-enter в layout).
 */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div
      data-page-enter
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
