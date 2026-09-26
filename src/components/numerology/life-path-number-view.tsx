"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useLocale, useTranslation } from "@/lib/i18n";
import { getLifePathMeaning } from "@/modules/numerology/domain/life-path-meanings.data";
import type { LifePathNumber } from "@/modules/numerology/domain/types";

export function LifePathNumberView({ number }: { number: LifePathNumber }) {
  const t = useTranslation();
  const { locale } = useLocale();
  const meaning = getLifePathMeaning(number, locale);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Link href="/numerology" className="text-sm text-silver-400 hover:text-gold-300">
        ← {t.lifePathPage.back}
      </Link>

      <div className="mt-6 text-center">
        <p className="font-display text-6xl text-gradient-gold">{meaning.number}</p>
        <h1 className="mt-2 font-display text-3xl text-silver-50">{meaning.title}</h1>
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {meaning.keywords.map((keyword) => (
            <Badge key={keyword} variant="gold">
              {keyword}
            </Badge>
          ))}
        </div>
      </div>

      <GlassPanel className="mt-8">
        <p className="text-sm leading-relaxed text-silver-300">{meaning.description}</p>
      </GlassPanel>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <GlassPanel>
          <h2 className="font-display text-lg text-silver-100">{t.common.strengths}</h2>
          <ul className="mt-2 space-y-1.5 text-sm text-silver-300">
            {meaning.strengths.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </GlassPanel>
        <GlassPanel>
          <h2 className="font-display text-lg text-silver-100">{t.common.watchFor}</h2>
          <ul className="mt-2 space-y-1.5 text-sm text-silver-300">
            {meaning.challenges.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </GlassPanel>
      </div>

      <div className="mt-10 text-center">
        <Button asChild size="lg">
          <Link href="/numerology">{t.lifePathPage.cta}</Link>
        </Button>
      </div>
    </div>
  );
}
