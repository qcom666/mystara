"use client";

import Link from "next/link";
import { TarotCardFace } from "@/components/tarot/tarot-card-face";
import { Button } from "@/components/ui/button";
import { useLocale, useTranslation } from "@/lib/i18n";
import { requireCardById } from "@/modules/tarot/domain/deck";

const HERO_CARD = requireCardById("the-star");

export function Hero() {
  const t = useTranslation();
  const { locale } = useLocale();

  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:pt-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div className="animate-fade-in-up text-center lg:text-left">
          <p className="text-xs uppercase tracking-[0.3em] text-gold-400">{t.marketing.hero.eyebrow}</p>
          <h1 className="mt-4 font-display text-4xl leading-tight text-silver-50 sm:text-5xl lg:text-6xl">
            {t.marketing.hero.titleLead} <span className="text-gradient-gold">{t.marketing.hero.titleHighlight}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-silver-400 lg:mx-0">{t.marketing.hero.body}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Button size="lg" asChild>
              <Link href="/reading">{t.landing.ctaPrimary}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#how-it-works">{t.landing.ctaSecondary}</Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto w-48 animate-float sm:w-56">
          <TarotCardFace card={HERO_CARD} locale={locale} className="card-glow w-full drop-shadow-2xl" />
        </div>
      </div>
    </section>
  );
}
