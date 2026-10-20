"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { assemblePage } from "@/components/motion/page-assemble";

/**
 * Первая отрисовка — это уже показанная сервером страница: собирать её заново значило бы спрятать готовый
 * экран и мигнуть. Поэтому сборка играет только при переходах внутри сайта.
 */
let initialPageShown = false;

/**
 * Переход при смене страницы: интерфейс нового раздела собирается на глазах (components/motion/page-assemble.ts).
 * Запускаем по смене адреса, а не только при пересоздании template: корневой template пересоздаётся лишь при
 * смене первого сегмента, а `/ru` → `/ru/astrology` для него один и тот же сегмент. useLayoutEffect — чтобы
 * куски встали в начальное положение до первой отрисовки новой страницы, без вспышки.
 */
export default function Template({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  // Запоминаем при первом рендере: в разработке React запускает эффект дважды, и флаг модуля ко второму
  // запуску уже стоял бы.
  const [isInitialPage] = useState(() => !initialPageShown);
  const [initialPath] = useState(pathname);
  const navigated = useRef(false);

  useLayoutEffect(() => {
    if (pathname !== initialPath) navigated.current = true;
    if (isInitialPage && !navigated.current) {
      initialPageShown = true;
      return;
    }
    if (!ref.current) return;
    return assemblePage(ref.current);
  }, [pathname, initialPath, isInitialPage]);

  return (
    // overflow-x: clip — куски, летящие из-за края, не дают странице на мгновение прокручиваться вбок.
    <div ref={ref} data-page-enter className="overflow-x-clip">
      {children}
    </div>
  );
}
