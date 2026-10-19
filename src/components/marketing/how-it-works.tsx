"use client";

import { motion, useScroll, useSpring, useTransform, type Variants } from "framer-motion";
import { MessageCircleQuestion, Shuffle, Sparkles, Wand2 } from "lucide-react";
import { useRef } from "react";
import { EASE_OUT, SectionHeading } from "@/components/motion/reveal";
import { useTranslation } from "@/lib/i18n";

const STEP_ICONS = [Wand2, MessageCircleQuestion, Shuffle, Sparkles] as const;

const stepsVariants: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.18, delayChildren: 0.2 } } };
const stepVariants: Variants = {
  hidden: { opacity: 0, y: 36, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: EASE_OUT } },
};
const iconVariants: Variants = {
  hidden: { scale: 0.4, rotate: -90 },
  show: { scale: 1, rotate: 0, transition: { type: "spring", stiffness: 220, damping: 14 } },
};

/**
 * Четыре шага. Золотая линия между значками прорисовывается вместе с прокруткой (на широком экране, где шаги
 * стоят в ряд), а сами шаги загораются по очереди: значок выкручивается из точки, текст поднимается.
 */
export function HowItWorks() {
  const t = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start 75%", "center 45%"] });
  const lineScale = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1]), { stiffness: 90, damping: 24 });

  return (
    <section ref={sectionRef} id="how-it-works" className="px-4 py-24">
      <div className="mx-auto max-w-5xl">
        <SectionHeading eyebrow={t.marketing.howItWorks.eyebrow} title={t.marketing.howItWorks.title} />
        <div className="relative mt-12">
          {/* Линия идёт от центра первого значка до центра последнего (по 12,5% с каждой стороны ряда). */}
          <div aria-hidden="true" className="absolute left-[12.5%] right-[12.5%] top-7 hidden h-px bg-silver-500/15 lg:block">
            <motion.div className="h-full origin-left bg-gradient-to-r from-gold-600 via-gold-300 to-gold-500" style={{ scaleX: lineScale }} />
          </div>
          <motion.div
            className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
            variants={stepsVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
          >
            {t.marketing.howItWorks.steps.map((step, index) => {
              const Icon = STEP_ICONS[index];
              return (
                <motion.div key={step.title} data-reveal variants={stepVariants} className="text-center">
                  <motion.div
                    data-reveal
                    variants={iconVariants}
                    className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold-500/30 bg-midnight-950 shadow-[0_0_24px_-6px_rgba(212,175,55,0.45)]"
                  >
                    <span className="absolute inset-0 rounded-full bg-gold-500/10" />
                    <Icon className="relative h-6 w-6 text-gold-400" />
                  </motion.div>
                  <p className="mt-4 text-xs text-silver-500">
                    {t.marketing.howItWorks.stepLabel} {index + 1}
                  </p>
                  <h3 className="mt-1 font-display text-lg text-silver-100">{step.title}</h3>
                  <p className="mt-1 text-sm text-silver-400">{step.body}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
