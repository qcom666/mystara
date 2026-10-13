"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useLocale, useTranslation } from "@/lib/i18n";
import type { NatalChart, PlanetPlacement } from "@/modules/astrology/domain/types";
import { describeAspect, describeChartRuler, describeHousePlacement, describePlacement } from "@/modules/astrology/domain/natal-chart-interpretation";
import { localizePlanet, requirePlanetById } from "@/modules/astrology/domain/planets.data";
import { localizeZodiacSign, requireZodiacSignById } from "@/modules/astrology/domain/zodiac-signs.data";

interface NatalChartResultProps {
  chart: NatalChart;
  /** Нет у сохранённой карты из истории: «построить ещё» имеет смысл только сразу после построения. */
  onGenerateAnother?: () => void;
}

function degreeLabel(placement: { degreeInSign: number; sign: PlanetPlacement["sign"] }, locale: "en" | "ru") {
  const sign = localizeZodiacSign(requireZodiacSignById(placement.sign), locale);
  return `${Math.floor(placement.degreeInSign)}° ${sign.symbol} ${sign.name}`;
}

function PlanetRow({ placement, locale }: { placement: PlanetPlacement; locale: "en" | "ru" }) {
  const t = useTranslation();
  const planet = localizePlanet(requirePlanetById(placement.planet), locale);
  const houseText = describeHousePlacement(placement, locale);

  return (
    <GlassPanel padding="sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-display text-xl text-gold-300">{planet.symbol}</span>
          <span className="text-sm font-medium text-silver-100">{planet.name}</span>
          {placement.isRetrograde && (
            <Badge variant="violet" className="text-[10px]">
              {t.natalChartPage.retrogradeLabel}
            </Badge>
          )}
        </div>
        <div className="text-right text-sm text-silver-300">
          <div>{degreeLabel(placement, locale)}</div>
          {placement.house !== null && (
            <div className="text-xs text-silver-500">
              {t.natalChartPage.houseLabel} {placement.house}
            </div>
          )}
        </div>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-silver-400">{describePlacement(placement, locale)}</p>
      {houseText && <p className="mt-1 text-xs leading-relaxed text-silver-500">{houseText}</p>}
    </GlassPanel>
  );
}

export function NatalChartResult({ chart, onGenerateAnother }: NatalChartResultProps) {
  const t = useTranslation();
  const { locale } = useLocale();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-gold-400">{t.natalChartPage.eyebrow}</p>
        <h1 className="mt-2 font-display text-3xl text-silver-50">{t.natalChartPage.title}</h1>
      </div>

      <div className="mt-8">
        <h2 className="font-display text-xl text-silver-100">{t.natalChartPage.planetsHeading}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {chart.planets.map((placement) => (
            <PlanetRow key={placement.planet} placement={placement} locale={locale} />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-display text-xl text-silver-100">{t.natalChartPage.anglesHeading}</h2>
        {chart.ascendant && chart.midheaven ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <GlassPanel padding="sm">
              <p className="text-xs uppercase tracking-wide text-silver-500">{t.natalChartPage.ascendantLabel}</p>
              <p className="mt-1 text-lg text-gradient-gold">{degreeLabel(chart.ascendant, locale)}</p>
            </GlassPanel>
            <GlassPanel padding="sm">
              <p className="text-xs uppercase tracking-wide text-silver-500">{t.natalChartPage.midheavenLabel}</p>
              <p className="mt-1 text-lg text-gradient-gold">{degreeLabel(chart.midheaven, locale)}</p>
            </GlassPanel>
            {chart.chartRuler && (
              <GlassPanel padding="sm" className="sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-silver-500">{t.natalChartPage.chartRulerLabel}</p>
                <p className="mt-2 text-sm leading-relaxed text-silver-300">{describeChartRuler(chart.chartRuler, chart.ascendant.sign, locale)}</p>
              </GlassPanel>
            )}
          </div>
        ) : (
          <GlassPanel className="mt-3">
            <p className="text-sm text-silver-400">{t.natalChartPage.housesUnavailableNote}</p>
          </GlassPanel>
        )}
      </div>

      <div className="mt-8">
        <h2 className="font-display text-xl text-silver-100">{t.natalChartPage.aspectsHeading}</h2>
        {chart.aspects.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {chart.aspects.map((aspect, index) => (
              <li key={`${aspect.a}-${aspect.b}-${index}`}>
                <GlassPanel padding="sm">
                  <p className="text-sm text-silver-300">{describeAspect(aspect, locale)}</p>
                </GlassPanel>
              </li>
            ))}
          </ul>
        ) : (
          <GlassPanel className="mt-3">
            <p className="text-sm text-silver-400">{t.natalChartPage.noAspectsNote}</p>
          </GlassPanel>
        )}
      </div>

      <p className="mt-8 text-center text-xs text-silver-500">{t.natalChartPage.disclaimer}</p>
      <p className="mt-2 text-center text-sm text-gold-300">{t.natalChartPage.savedNotice}</p>

      {onGenerateAnother && (
        <div className="mt-6 text-center">
          <Button variant="ghost" onClick={onGenerateAnother}>
            {t.natalChartPage.generateAnotherCta}
          </Button>
        </div>
      )}
    </div>
  );
}
