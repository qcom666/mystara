"use client";

import {
  animate,
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  wrap,
} from "framer-motion";
import { type CSSProperties, type PointerEvent, type ReactNode, useEffect, useRef } from "react";
import { useLiteMode } from "@/lib/perf";
import { cn } from "@/lib/utils";

/**
 * Кнопка или ссылка, которая слегка тянется к курсору, пока он рядом, и мягко возвращается на место.
 * На сенсорных экранах не двигается: курсора там нет.
 */
export function Magnetic({ children, strength = 0.35, className }: { children: ReactNode; strength?: number; className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 15, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 220, damping: 15, mass: 0.4 });

  function handleMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - rect.left - rect.width / 2) * strength);
    y.set((event.clientY - rect.top - rect.height / 2) * strength);
  }

  return (
    <motion.div
      className={cn("inline-block", className)}
      style={{ x: springX, y: springY }}
      onPointerMove={handleMove}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

const ZODIAC = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

/**
 * Зодиакальный круг за картой первого экрана: внешнее кольцо со знаками медленно вращается, внутреннее с
 * делениями — навстречу. Чистый SVG и CSS-вращение, без перерисовок.
 */
export function ZodiacWheel({ className }: { className?: string }) {
  const ticks = Array.from({ length: 72 }, (_, index) => index);
  return (
    <div aria-hidden="true" className={cn("pointer-events-none", className)}>
      <svg viewBox="0 0 400 400" className="h-full w-full motion-safe:animate-[spin_160s_linear_infinite]">
        <circle cx="200" cy="200" r="196" fill="none" stroke="rgba(230,195,104,0.22)" strokeWidth="1" />
        <circle cx="200" cy="200" r="160" fill="none" stroke="rgba(230,195,104,0.14)" strokeWidth="1" />
        {ZODIAC.map((sign, index) => {
          const angle = (index / 12) * Math.PI * 2 - Math.PI / 2;
          // Округление: Node.js и браузер расходятся в последних знаках синуса, а разные строки в атрибутах
          // ломали бы гидратацию.
          const x = Number((200 + Math.cos(angle) * 178).toFixed(2));
          const y = Number((200 + Math.sin(angle) * 178).toFixed(2));
          const lineAngle = (index / 12) * 360 + 15;
          return (
            <g key={sign}>
              <line
                x1="200"
                y1="4"
                x2="200"
                y2="40"
                stroke="rgba(230,195,104,0.18)"
                strokeWidth="1"
                transform={`rotate(${lineAngle} 200 200)`}
              />
              <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="17" fill="rgba(243,218,143,0.55)">
                {`${sign}︎`}
              </text>
            </g>
          );
        })}
      </svg>
      <svg viewBox="0 0 400 400" className="absolute inset-[14%] h-[72%] w-[72%] motion-safe:animate-[spin_110s_linear_infinite_reverse]">
        <circle cx="200" cy="200" r="196" fill="none" stroke="rgba(196,176,251,0.18)" strokeWidth="1" strokeDasharray="2 6" />
        {ticks.map((tick) => (
          <line
            key={tick}
            x1="200"
            y1="6"
            x2="200"
            y2={tick % 6 === 0 ? 22 : 14}
            stroke={tick % 6 === 0 ? "rgba(230,195,104,0.35)" : "rgba(230,195,104,0.15)"}
            strokeWidth="1"
            transform={`rotate(${tick * 5} 200 200)`}
          />
        ))}
      </svg>
    </div>
  );
}

/**
 * Бегущая строка: плывёт сама, а при прокрутке ускоряется в сторону прокрутки и слегка наклоняется,
 * как будто её тянут. Текст повторён четыре раза, сдвиг идёт по кругу, поэтому стык не виден.
 */
function MarqueeRow({
  items,
  baseVelocity,
  itemClassName,
  running,
}: {
  items: readonly string[];
  baseVelocity: number;
  itemClassName?: string;
  /** Строка на экране и устройство не слабое: иначе кадры не считаем вовсе. */
  running: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [-1000, 0, 1000], [-4, 0, 4], { clamp: false });
  const skew = useTransform(smoothVelocity, [-2000, 0, 2000], [8, 0, -8]);
  const x = useTransform(baseX, (value) => `${wrap(-25, -50, value)}%`);
  const direction = useRef(1);

  useAnimationFrame((_, delta) => {
    if (reduceMotion || !running) return;
    let moveBy = direction.current * baseVelocity * (delta / 1000);
    const factor = velocityFactor.get();
    if (factor < 0) direction.current = -1;
    else if (factor > 0) direction.current = 1;
    moveBy += direction.current * moveBy * factor;
    baseX.set(baseX.get() + moveBy);
  });

  const line = items.map((item) => (
    <span key={item} className="flex items-center gap-6">
      <span className={itemClassName}>{item}</span>
      <span className="text-gold-400/60">✦</span>
    </span>
  ));

  return (
    <div className="flex overflow-hidden whitespace-nowrap">
      <motion.div className="flex shrink-0 gap-6 pr-6" style={{ x, skewX: skew }}>
        {[0, 1, 2, 3].map((copy) => (
          <span key={copy} className="flex shrink-0 gap-6" aria-hidden={copy > 0}>
            {line}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export function MarqueeBand({ items }: { items: readonly string[] }) {
  // Строку двигает JavaScript в каждом кадре, поэтому за пределами экрана и в облегчённом режиме она стоит.
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { margin: "100px 0px" });
  const lite = useLiteMode();
  const running = inView && !lite;
  return (
    <section ref={ref} aria-label={items.join(", ")} className="relative border-y border-white/5 bg-midnight-950/40 py-5 font-display text-2xl text-silver-200 sm:text-3xl">
      <div className="space-y-3 [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
        <MarqueeRow items={items} baseVelocity={-2.2} running={running} />
        {/* Градиент — на каждом слове: background-clip: text не переносится на сдвигаемых потомков. */}
        <MarqueeRow items={[...items].reverse()} baseVelocity={1.6} itemClassName="text-gradient-gold" running={running} />
      </div>
    </section>
  );
}

/**
 * Число, которое отсчитывается от нуля, когда появляется на экране. Экранный диктор сразу слышит итог.
 * Значение живёт в motion value: кадры не перерисовывают React, а сервер и браузер начинают с одного нуля
 * (иначе при отключённых анимациях браузер сразу рисовал бы итог и гидратация расходилась).
 */
export function CountUp({ value, className, duration = 1.8 }: { value: number; className?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduceMotion = useReducedMotion();
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) {
      count.set(value);
      return;
    }
    const controls = animate(count, value, { duration, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [inView, reduceMotion, value, duration, count]);

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{value}</span>
      <motion.span aria-hidden="true">{rounded}</motion.span>
    </span>
  );
}

/**
 * Крупный символ раздела (знак зодиака или число): влетает с поворотом и пружиной, за ним дышит сияние,
 * а у знаков вокруг вращается зодиакальный круг.
 */
export function HeroGlyph({ children, ring = false, className }: { children: ReactNode; ring?: boolean; className?: string }) {
  return (
    <div className={cn("relative mx-auto flex h-40 w-40 items-center justify-center", className)}>
      {ring && (
        <motion.div
          data-reveal
          aria-hidden="true"
          className="absolute -inset-10"
          initial={{ opacity: 0, scale: 0.6, rotate: -60 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <ZodiacWheel className="relative h-full w-full" />
        </motion.div>
      )}
      {/* Дыхание сияния — CSS-круг (globals.css): его крутит видеокарта, а не главный поток. */}
      <div
        aria-hidden="true"
        className="absolute inset-8 rounded-full bg-gold-500/25 blur-2xl motion-safe:animate-glow-pulse"
        style={{ "--glow-scale-max": 1.12, animationDuration: "5s" } as CSSProperties}
      />
      <motion.p
        data-reveal
        className="relative font-display text-6xl text-gradient-gold"
        initial={{ opacity: 0, scale: 0.35, rotate: -120, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, rotate: 0, filter: "blur(0px)" }}
        transition={{ type: "spring", stiffness: 110, damping: 13, mass: 0.9 }}
      >
        {children}
      </motion.p>
    </div>
  );
}

/** Карта влетает, переворачиваясь лицом (страница карты и подробности карты в раскладе). */
export function CardFlipIn({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      data-reveal
      className={className}
      style={{ transformPerspective: 900 }}
      initial={{ opacity: 0, rotateY: -100, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, rotateY: 0, scale: 1, y: 0 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
