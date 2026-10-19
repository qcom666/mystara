"use client";

import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { type PointerEvent, type RefObject, useRef } from "react";
import { EASE_OUT, SplitWords } from "@/components/motion/reveal";
import Link from "@/components/shared/localized-link";
import { TarotCardFace } from "@/components/tarot/tarot-card-face";
import { Button } from "@/components/ui/button";
import { useLocale, useTranslation } from "@/lib/i18n";
import { requireCardById } from "@/modules/tarot/domain/deck";

const HERO_CARD = requireCardById("the-star");

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 24, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.9, ease: EASE_OUT, delay },
});

/**
 * Карта первого экрана: наклоняется вслед за курсором (объёмно, с пружиной), при прокрутке уплывает вверх,
 * поворачивается и гаснет. На сенсорных экранах наклона нет: курсора там нет.
 */
function HeroCard({ scrollTarget }: { scrollTarget: RefObject<HTMLElement | null> }) {
  const { locale } = useLocale();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-14, 14]), { stiffness: 140, damping: 16 });
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [12, -12]), { stiffness: 140, damping: 16 });
  const glareX = useTransform(pointerX, [-0.5, 0.5], ["20%", "80%"]);
  const glareY = useTransform(pointerY, [-0.5, 0.5], ["15%", "85%"]);
  const glare = useTransform([glareX, glareY], ([x, y]) => `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,0.22), transparent 55%)`);

  const { scrollYProgress } = useScroll({ target: scrollTarget, offset: ["start start", "end start"] });
  const scrollY = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const scrollRotate = useTransform(scrollYProgress, [0, 1], [0, -10]);
  const scrollOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  function handleMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
  }

  function handleLeave() {
    pointerX.set(0);
    pointerY.set(0);
  }

  return (
    <motion.div style={{ y: scrollY, rotate: scrollRotate, opacity: scrollOpacity }} className="relative mx-auto w-48 sm:w-56">
      {/* Мягкое сияние за картой, медленно дышит. */}
      <motion.div
        aria-hidden="true"
        className="absolute -inset-10 rounded-full bg-gold-500/20 blur-3xl"
        animate={{ opacity: [0.35, 0.7, 0.35], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        data-reveal
        initial={{ opacity: 0, y: 60, rotate: -8, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
        transition={{ duration: 1.2, ease: EASE_OUT, delay: 0.35 }}
        style={{ perspective: 1000 }}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
      >
        {/* Наклон и покачивание на разных элементах: два transform на одном перебивали бы друг друга. */}
        <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}>
          <div className="relative animate-float">
            <TarotCardFace card={HERO_CARD} locale={locale} className="card-glow w-full drop-shadow-2xl" />
            <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-xl mix-blend-overlay" style={{ background: glare }} />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/** Подсказка «листайте вниз»: «мышка» с опускающейся точкой, гаснет, как только страницу начали листать. */
function ScrollCue({ scrollTarget }: { scrollTarget: RefObject<HTMLElement | null> }) {
  const { scrollYProgress } = useScroll({ target: scrollTarget, offset: ["start start", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  return (
    <motion.div aria-hidden="true" style={{ opacity }} className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.8 }}
        className="flex h-9 w-6 justify-center rounded-full border border-silver-400/40 pt-2"
      >
        <span className="block h-2 w-1 rounded-full bg-gold-300 motion-safe:animate-scroll-cue" />
      </motion.div>
    </motion.div>
  );
}

export function Hero() {
  const t = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section ref={sectionRef} className="relative overflow-hidden px-4 pb-28 pt-16 sm:pt-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div className="text-center lg:text-left">
          <motion.p data-reveal {...fadeUp(0)} className="text-xs uppercase tracking-[0.3em] text-gold-400">
            {t.marketing.hero.eyebrow}
          </motion.p>
          <h1 className="mt-4 font-display text-4xl leading-tight text-silver-50 sm:text-5xl lg:text-6xl">
            <SplitWords text={t.marketing.hero.titleLead} immediate delay={0.15} stagger={0.07} />{" "}
            <SplitWords
              text={t.marketing.hero.titleHighlight}
              immediate
              delay={0.15 + t.marketing.hero.titleLead.split(/\s+/).length * 0.07}
              stagger={0.07}
              wordClassName="text-gradient-gold"
            />
          </h1>
          <motion.p data-reveal {...fadeUp(0.9)} className="mx-auto mt-5 max-w-lg text-silver-400 lg:mx-0">
            {t.marketing.hero.body}
          </motion.p>
          <motion.div data-reveal {...fadeUp(1.1)} className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Button size="lg" asChild>
              <Link href="/reading">{t.landing.ctaPrimary}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#how-it-works">{t.landing.ctaSecondary}</Link>
            </Button>
          </motion.div>
        </div>

        <HeroCard scrollTarget={sectionRef} />
      </div>
      <ScrollCue scrollTarget={sectionRef} />
    </section>
  );
}
