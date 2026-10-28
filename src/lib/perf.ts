"use client";

import { useEffect, useSyncExternalStore } from "react";
import { PERF_ATTRIBUTE } from "./perf-hint";

/**
 * Облегчённый режим для слабых устройств: на <html> ставится data-perf="lite", и CSS (globals.css, блок
 * «Слабые устройства») убирает дорогое — лишние слои звёзд, бесконечные украшения, переливы, размытия;
 * сборка страницы при переходе становится проще (components/motion/page-assemble.ts). Ничего не хранится:
 * решение принимается заново при каждой загрузке.
 *
 * Два шага. До первой отрисовки — по признакам устройства (скрипт в <head>, perf-hint.ts): мало памяти,
 * мало ядер при небольшой памяти или включённая экономия трафика. Остальные устройства проверяются делом
 * (usePerfMonitor): через пару секунд после загрузки замеряем кадры, и если страница не держит хотя бы
 * ~40 кадров в секунду, включаем облегчённый режим на лету.
 */

export function isLiteMode(): boolean {
  return typeof document !== "undefined" && document.documentElement.getAttribute(PERF_ATTRIBUTE) === "lite";
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: [PERF_ATTRIBUTE] });
  return () => observer.disconnect();
}

/** Включён ли облегчённый режим; на сервере и при гидратации — нет. */
export function useLiteMode(): boolean {
  return useSyncExternalStore(subscribe, isLiteMode, () => false);
}

/** Сколько ждём после загрузки (гидратация и первые появления не в счёт) и сколько меряем. */
const PROBE_DELAY_MS = 2000;
const PROBE_LENGTH_MS = 2500;
/** Медиана интервала кадров дольше этого — меньше ~40 кадров в секунду. */
const SLOW_FRAME_MS = 25;
/**
 * Интервалы длиннее этого — не слабость устройства, а приостановленная вкладка (браузер почти перестаёт
 * выдавать кадры невидимой странице); такой замер не засчитываем.
 */
const THROTTLED_FRAME_MS = 200;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

/** Один замер кадров после загрузки страницы; при медленных кадрах включает облегчённый режим. */
export function usePerfMonitor(): void {
  useEffect(() => {
    if (isLiteMode() || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frameId = 0;
    const intervals: number[] = [];

    function measure() {
      if (document.visibilityState !== "visible") return;
      let last = performance.now();
      const started = last;
      const tick = (now: number) => {
        intervals.push(now - last);
        last = now;
        if (now - started < PROBE_LENGTH_MS) {
          frameId = requestAnimationFrame(tick);
          return;
        }
        // Первые кадры после старта замера бывают неровными сами по себе: их не считаем.
        const typical = median(intervals.slice(3));
        if (typical > SLOW_FRAME_MS && typical < THROTTLED_FRAME_MS) document.documentElement.setAttribute(PERF_ATTRIBUTE, "lite");
      };
      frameId = requestAnimationFrame(tick);
    }

    const timer = window.setTimeout(measure, PROBE_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(frameId);
    };
  }, []);
}
