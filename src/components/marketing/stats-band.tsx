"use client";

import { CountUp } from "@/components/motion/effects";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { useTranslation } from "@/lib/i18n";
import { PLANETS } from "@/modules/astrology/domain/planets.data";
import { getAllZodiacSigns } from "@/modules/astrology/domain/zodiac-signs.data";
import { getAllCards } from "@/modules/tarot/domain/deck";
import { getAllSpreads } from "@/modules/tarot/domain/spreads.data";

/** Полоса с цифрами: значения берутся из самих данных сайта и отсчитываются от нуля при появлении. */
export function StatsBand() {
  const t = useTranslation();
  const stats = [
    { value: getAllCards().length, label: t.marketing.stats.cards },
    { value: getAllSpreads().length, label: t.marketing.stats.spreads },
    { value: getAllZodiacSigns().length, label: t.marketing.stats.signs },
    { value: PLANETS.length, label: t.marketing.stats.planets },
  ];

  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-5xl">
        <Reveal as="p" y={0} x={-16} className="text-center text-xs uppercase tracking-[0.2em] text-gold-400">
          {t.marketing.stats.eyebrow}
        </Reveal>
        <RevealGroup className="mt-8 grid grid-cols-2 gap-6 lg:grid-cols-4" stagger={0.12} delay={0.1}>
          {stats.map((stat) => (
            <RevealItem key={stat.label} className="text-center">
              <CountUp value={stat.value} className="font-display text-6xl text-gradient-gold sm:text-7xl" />
              <p className="mx-auto mt-2 max-w-[12rem] text-sm text-silver-400">{stat.label}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
