"use client";

import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { type PointerEvent, type RefObject, useRef } from "react";
import { Magnetic, ZodiacWheel } from "@/components/motion/effects";
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
  // Круг при прокрутке разрастается и гаснет быстрее карты: карта будто выходит из него вперёд.
  const wheelScale = useTransform(scrollYProgress, [0, 1], [1, 1.45]);
  const wheelOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

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
      {/* Зодиакальный круг за картой: проявляется, вращается, при прокрутке разрастается и гаснет. */}
      <motion.div
        data-reveal
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 aspect-square w-[230%] -translate-x-1/2 -translate-y-1/2"
        initial={{ opacity: 0, scale: 0.7, rotate: -40 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 2, ease: EASE_OUT, delay: 0.2 }}
      >
        <motion.div className="h-full w-full" style={{ scale: wheelScale, opacity: wheelOpacity }}>
          <ZodiacWheel className="relative h-full w-full" />
        </motion.div>
      </motion.div>
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

/** Туманности за первым экраном: большие размытые пятна золота и фиолета медленно перетекают. */
function Nebula() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-[10%] top-[5%] h-[28rem] w-[28rem] rounded-full bg-violet-600/20 blur-[110px] motion-safe:animate-nebula" />
      <div
        className="absolute right-[-8%] top-[20%] h-[24rem] w-[24rem] rounded-full bg-gold-500/15 blur-[110px] motion-safe:animate-nebula"
        style={{ animationDelay: "-9s", animationDuration: "31s" }}
      />
      <div
        className="absolute bottom-[-10%] left-[35%] h-[22rem] w-[22rem] rounded-full bg-violet-400/10 blur-[100px] motion-safe:animate-nebula"
        style={{ animationDelay: "-17s", animationDuration: "36s" }}
      />
    </div>
  );
}

export function Hero() {
  const t = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);

  // Мягкий свет следует за курсором по первому экрану (координаты — в CSS-переменных, без перерисовок).
  function handleSpotlight(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--hero-x", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--hero-y", `${event.clientY - rect.top}px`);
  }

  return (
    <section ref={sectionRef} onPointerMove={handleSpotlight} className="relative isolate overflow-hidden px-4 pb-28 pt-16 sm:pt-24">
      <Nebula />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(520px_circle_at_var(--hero-x,70%)_var(--hero-y,40%),rgba(230,195,104,0.09),transparent_60%)]"
      />
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
              wordClassName="text-shimmer-gold"
            />
          </h1>
          <motion.p data-reveal {...fadeUp(0.9)} className="mx-auto mt-5 max-w-lg text-silver-400 lg:mx-0">
            {t.marketing.hero.body}
          </motion.p>
          <motion.div data-reveal {...fadeUp(1.1)} className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Magnetic>
              <Button size="lg" className="shadow-[0_0_40px_-10px_rgba(212,175,55,0.7)]" asChild>
                <Link href="/reading">{t.landing.ctaPrimary}</Link>
              </Button>
            </Magnetic>
            <Magnetic strength={0.25}>
              <Button size="lg" variant="outline" asChild>
                <Link href="#how-it-works">{t.landing.ctaSecondary}</Link>
              </Button>
            </Magnetic>
          </motion.div>
        </div>

        <HeroCard scrollTarget={sectionRef} />
      </div>
      <ScrollCue scrollTarget={sectionRef} />
    </section>
  );
}
