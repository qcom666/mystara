"use client";

import { Reveal, SplitWords } from "@/components/motion/reveal";
import Link from "@/components/shared/localized-link";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

/**
 * Финальный призыв: панель поднимается и увеличивается до своего размера, заголовок выезжает по словам,
 * а по рамке непрерывно бежит золотой отблеск (вращающийся конический градиент под непрозрачной панелью,
 * виден только в зазоре в 2 пикселя).
 */
export function CTASection() {
  const t = useTranslation();

  return (
    <section className="px-4 py-24">
      <Reveal y={50} scale={0.92} className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl p-[2px] shadow-[0_0_60px_-20px_rgba(212,175,55,0.55)]">
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 aspect-square w-[160%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,rgba(230,195,104,0.08)_0deg,rgba(243,218,143,1)_70deg,rgba(230,195,104,0.08)_140deg,rgba(167,139,250,0.08)_200deg,rgba(196,176,251,0.9)_270deg,rgba(167,139,250,0.08)_340deg)] motion-safe:animate-border-sweep"
        />
        <div className="card-glow noise-overlay relative rounded-[calc(1.5rem-2px)] bg-midnight-950/95 p-10 text-center sm:p-14">
          <h2 className="font-display text-3xl text-silver-50 sm:text-4xl">
            <SplitWords text={t.marketing.cta.title} delay={0.25} />
          </h2>
          <Reveal as="p" delay={0.5} y={16} className="mx-auto mt-3 max-w-lg text-silver-400">
            {t.marketing.cta.subtitle}
          </Reveal>
          <Reveal delay={0.7} y={16}>
            <Button size="lg" className="mt-8 shadow-[0_0_40px_-8px_rgba(212,175,55,0.7)]" asChild>
              <Link href="/reading">{t.landing.ctaPrimary}</Link>
            </Button>
          </Reveal>
        </div>
      </Reveal>
    </section>
  );
}
