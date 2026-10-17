"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useLocale, useTranslation } from "@/lib/i18n";
import type { ZodiacSign } from "@/modules/astrology/domain/types";
import { localizeZodiacSign } from "@/modules/astrology/domain/zodiac-signs.data";

export function ZodiacSignView({ sign: baseSign }: { sign: ZodiacSign }) {
  const t = useTranslation();
  const { locale } = useLocale();
  const sign = localizeZodiacSign(baseSign, locale);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Link href="/astrology" className="text-sm text-silver-400 hover:text-gold-300">
        ← {t.zodiacPage.back}
      </Link>

      <div className="mt-6 text-center">
        <p className="font-display text-6xl text-gradient-gold">{`${sign.symbol}\uFE0E`}</p>
        <h1 className="mt-2 font-display text-3xl text-silver-50">{sign.name}</h1>
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          <Badge variant="violet">{t.astrologyTerms.elements[sign.element]}</Badge>
          <Badge variant="violet">{t.astrologyTerms.modalities[sign.modality]}</Badge>
          <Badge variant="violet">
            {t.astrologyPage.ruledBy} {sign.rulingPlanet}
          </Badge>
        </div>
      </div>

      <GlassPanel className="mt-8">
        <p className="text-sm leading-relaxed text-silver-300">{sign.description}</p>
      </GlassPanel>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <GlassPanel>
          <h2 className="font-display text-lg text-silver-100">{t.common.strengths}</h2>
          <ul className="mt-2 space-y-1.5 text-sm text-silver-300">
            {sign.strengths.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </GlassPanel>
        <GlassPanel>
          <h2 className="font-display text-lg text-silver-100">{t.common.watchFor}</h2>
          <ul className="mt-2 space-y-1.5 text-sm text-silver-300">
            {sign.challenges.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </GlassPanel>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild variant="secondary">
          <Link href={`/astrology/horoscope/${sign.id}`}>{t.horoscopePage.resultCta}</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href={`/astrology/compatibility?sign=${sign.id}`}>{t.horoscopePage.compatibilityCta}</Link>
        </Button>
      </div>

      <div className="mt-10 text-center">
        <Button asChild size="lg">
          <Link href="/astrology">{t.zodiacPage.cta}</Link>
        </Button>
      </div>
    </div>
  );
}
