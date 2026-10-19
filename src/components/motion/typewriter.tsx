"use client";

import { useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Текст «печатается», когда доходит до экрана, как ответ ИИ. Место под весь текст занято сразу (невидимая
 * копия в той же ячейке сетки), поэтому страница не прыгает. Экранный диктор читает полный текст, а
 * печатающуюся копию пропускает; при «уменьшить движение» текст показывается сразу.
 */
export function Typewriter({ text, className, charsPerSecond = 70 }: { text: string; className?: string; charsPerSecond?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(0);
  const done = reduceMotion || shown >= text.length;

  useEffect(() => {
    if (!inView || reduceMotion) return;
    let frame = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const next = Math.min(text.length, Math.floor(((now - started) / 1000) * charsPerSecond));
      setShown(next);
      if (next < text.length) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduceMotion, text, charsPerSecond]);

  return (
    <span ref={ref} className={cn("grid", className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="invisible col-start-1 row-start-1">
        {text}
      </span>
      <span aria-hidden="true" className="col-start-1 row-start-1">
        {done ? text : text.slice(0, shown)}
        {!done && <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.15em] animate-pulse bg-gold-300" />}
      </span>
    </span>
  );
}
