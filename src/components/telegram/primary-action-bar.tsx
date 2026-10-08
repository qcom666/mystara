"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTelegram } from "./telegram-provider";

/**
 * Главное действие (или действия) экрана. На сайте это просто обёртка вокруг обычных кнопок страницы.
 * Внутри мини-приложения Telegram те же кнопки выносятся в панель, прижатую к низу экрана, чтобы главное
 * действие всегда было под рукой; оформление как на сайте (золотая `Button` на тёмной стеклянной панели),
 * а не нативная синяя кнопка MainButton Telegram.
 *
 * Выводится через портал в <body>: `position: fixed` отсчитывается от ближайшего предка с transform или
 * backdrop-filter (у стеклянных панелей и анимированных обёрток шагов есть и то и другое), и панель
 * приклеилась бы к панели, а не к экрану. Кнопка отправки формы, оказавшись в этой панели, уже не лежит
 * внутри своей <form> в DOM, поэтому такие кнопки должны указывать форму атрибутом `form`.
 */
export function PrimaryActionBar({ children, className }: { children: ReactNode; className?: string }) {
  const { isTelegram } = useTelegram();

  // Не даём последнему фрагменту страницы спрятаться за панелью.
  useEffect(() => {
    if (!isTelegram) return;
    const previous = document.body.style.paddingBottom;
    document.body.style.paddingBottom = "calc(6rem + env(safe-area-inset-bottom))";
    return () => {
      document.body.style.paddingBottom = previous;
    };
  }, [isTelegram]);

  if (!isTelegram) return <div className={className}>{children}</div>;

  return createPortal(
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gold-500/15 bg-midnight-950/90 px-4 pt-3 backdrop-blur-xl"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-md flex-col gap-2 [&>*]:w-full">{children}</div>
    </div>,
    document.body,
  );
}
