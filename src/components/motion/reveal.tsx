"use client";

import { motion, useScroll, useSpring, type Variants } from "framer-motion";
import { Fragment, type ReactNode, useRef, type PointerEvent } from "react";
import { cn } from "@/lib/utils";

/**
 * Анимации главной страницы при прокрутке: блок проявляется, когда доходит до экрана, — поднимается,
 * проявляется и становится резким. Анимируются только opacity, transform и filter, поэтому на телефонах
 * не тормозит. Для «уменьшить движение» сдвиги отключает MotionConfig на странице (остаётся плавное
 * появление), а без JavaScript всё видно сразу: см. правило для [data-reveal] в корневом layout.
 */

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const VIEWPORT = { once: true, amount: 0.25 } as const;

const TAGS = { div: motion.div, p: motion.p, li: motion.li, section: motion.section, span: motion.span } as const;

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Насколько ниже блок стоит до появления, в пикселях. */
  y?: number;
  x?: number;
  scale?: number;
  as?: keyof typeof TAGS;
}

/** Блок, который проявляется при появлении на экране. */
export function Reveal({ children, className, delay = 0, y = 28, x = 0, scale = 1, as = "div" }: RevealProps) {
  const Tag = TAGS[as];
  return (
    <Tag
      data-reveal
      className={className}
      initial={{ opacity: 0, y, x, scale, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, x: 0, scale: 1, filter: "blur(0px)" }}
      viewport={VIEWPORT}
      transition={{ duration: 0.9, ease: EASE_OUT, delay }}
    >
      {children}
    </Tag>
  );
}

const groupVariants = (stagger: number, delay: number): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 32, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: EASE_OUT } },
};

/** Группа, дети которой (RevealItem) проявляются по очереди. */
export function RevealGroup({ children, className, stagger = 0.1, delay = 0 }: { children: ReactNode; className?: string; stagger?: number; delay?: number }) {
  return (
    <motion.div className={className} variants={groupVariants(stagger, delay)} initial="hidden" whileInView="show" viewport={VIEWPORT}>
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div data-reveal className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}

const wordVariants: Variants = {
  hidden: { y: "110%", opacity: 0, filter: "blur(6px)" },
  show: { y: "0%", opacity: 1, filter: "blur(0px)", transition: { duration: 0.75, ease: EASE_OUT } },
};

interface SplitWordsProps {
  text: string;
  className?: string;
  /** Классы для каждого слова (например, золотой градиент у выделенной части заголовка). */
  wordClassName?: string;
  /** Пауза между словами, секунды. */
  stagger?: number;
  delay?: number;
  /** true — анимация сразу при загрузке (первый экран), иначе при появлении на экране. */
  immediate?: boolean;
}

/**
 * Текст, который выезжает снизу по словам: каждое слово в своей «маске», поэтому появляется, как из-под
 * линии. Пробелы остаются обычным текстом, так что экранные дикторы читают фразу целиком.
 */
export function SplitWords({ text, className, wordClassName, stagger = 0.06, delay = 0, immediate = false }: SplitWordsProps) {
  const words = text.split(/\s+/).filter(Boolean);
  const trigger = immediate ? { animate: "show" as const } : { whileInView: "show" as const, viewport: VIEWPORT };
  return (
    <motion.span className={className} variants={groupVariants(stagger, delay)} initial="hidden" {...trigger}>
      {words.map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          <span className="inline-block overflow-hidden pb-[0.12em] align-bottom">
            <motion.span data-reveal className={cn("inline-block", wordClassName)} variants={wordVariants}>
              {word}
            </motion.span>
          </span>
          {index < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </motion.span>
  );
}

/** Заголовок секции: надпись над ним, сам заголовок по словам и подзаголовок — по очереди. */
export function SectionHeading({ eyebrow, title, subtitle, className }: { eyebrow: string; title: string; subtitle?: string; className?: string }) {
  return (
    <div className={cn("text-center", className)}>
      <Reveal as="p" y={0} x={-16} className="text-xs uppercase tracking-[0.2em] text-gold-400">
        {eyebrow}
      </Reveal>
      <h2 className="mt-3 font-display text-3xl text-silver-50 sm:text-4xl">
        <SplitWords text={title} delay={0.1} />
      </h2>
      {subtitle && (
        <Reveal as="p" delay={0.35} y={16} className="mx-auto mt-3 max-w-xl text-silver-400">
          {subtitle}
        </Reveal>
      )}
    </div>
  );
}

/** Тонкая золотая полоса вверху экрана: сколько страницы уже пролистано. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-gradient-to-r from-gold-600 via-gold-300 to-gold-600"
      style={{ scaleX }}
    />
  );
}

/**
 * Карточка с подсветкой, которая следует за курсором. Положение пишется прямо в CSS-переменные элемента,
 * без перерисовки React, поэтому движение мыши ничего не нагружает.
 */
export function SpotlightCard({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  function handleMove(event: PointerEvent<HTMLDivElement>) {
    const element = ref.current;
    if (!element || event.pointerType === "touch") return;
    const rect = element.getBoundingClientRect();
    element.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
    element.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
  }
  return (
    <div ref={ref} onPointerMove={handleMove} className={cn("spotlight-card group/spot relative h-full", className)}>
      {children}
    </div>
  );
}
