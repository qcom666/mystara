"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useTranslation } from "@/lib/i18n";
import { getNatalChartPrice } from "@/lib/pricing/natal-chart-pricing";

/** Стоит между формой знака зодиака и списком знаков на /astrology: вход в платную натальную карту. */
export function NatalChartTeaser() {
  const t = useTranslation();
  const price = getNatalChartPrice();

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16">
      <GlassPanel variant="solid" className="text-center">
        <h2 className="font-display text-2xl text-gold-300">{t.astrologyPage.natalChartTeaserTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-silver-300">{t.astrologyPage.natalChartTeaserBody}</p>
        <p className="mt-3 text-sm text-silver-400">
          {price.formatted} · {t.natalChartPage.packSize}
        </p>
        <Button asChild className="mt-4">
          <Link href="/astrology/natal-chart">{t.astrologyPage.natalChartTeaserCta}</Link>
        </Button>
      </GlassPanel>
    </div>
  );
}
