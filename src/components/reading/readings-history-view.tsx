"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { formatCardCount, useLocale, useTranslation, type Locale } from "@/lib/i18n";
import { localizeZodiacSign, requireZodiacSignById } from "@/modules/astrology/domain/zodiac-signs.data";
import type { Sect, ZodiacSignId } from "@/modules/astrology/domain/types";
import { getLifePathMeaning } from "@/modules/numerology/domain/life-path-meanings.data";
import { getNumberTypeLabels } from "@/modules/numerology/domain/number-type-framing";
import type { LifePathNumber } from "@/modules/numerology/domain/types";
import { getSpreadById, getSpreadName } from "@/modules/tarot/domain/spreads.data";

function zodiacLabel(signId: ZodiacSignId, locale: Locale): string {
  const sign = localizeZodiacSign(requireZodiacSignById(signId), locale);
  return `${sign.symbol} ${sign.name}`;
}

function spreadLabel(spreadId: string, locale: Locale): string {
  const spread = getSpreadById(spreadId);
  return spread ? getSpreadName(spread, locale) : spreadId;
}

interface ReadingSummary {
  id: string;
  spreadId: string;
  question: string | null;
  createdAt: string;
  isFavorite: boolean;
  cardCount: number;
}

interface NumerologySummary {
  id: string;
  number: LifePathNumber;
  createdAt: string;
  /** Есть, только если указано имя хотя бы с одной буквой, которую можно посчитать (см. hasCalculableLetters). */
  fullName: string | null;
}

interface AstrologySummary {
  id: string;
  signId: ZodiacSignId;
  createdAt: string;
  /** null, если пользователь тогда выбрал «Не уверен». */
  sect: Sect | null;
}

export type ReadingsHistoryData =
  | { status: "unconfigured" }
  | { status: "ready"; readings: ReadingSummary[]; numerologyReadings: NumerologySummary[]; astrologyReadings: AstrologySummary[] };

export function ReadingsHistoryView({ data }: { data: ReadingsHistoryData }) {
  const t = useTranslation();
  const { locale } = useLocale();

  if (data.status === "unconfigured") {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <GlassPanel>
          <h1 className="font-display text-2xl text-silver-100">{t.readingsPage.historyUnavailableTitle}</h1>
          <p className="mt-3 text-sm text-silver-400">{t.readingsPage.dbNotConfiguredBody}</p>
        </GlassPanel>
      </div>
    );
  }

  const { readings, numerologyReadings, astrologyReadings } = data;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-silver-50">{t.readingsPage.title}</h1>
        <Button asChild size="sm">
          <Link href="/reading">{t.readingsPage.newReadingCta}</Link>
        </Button>
      </div>

      {readings.length === 0 ? (
        <GlassPanel className="mt-8 text-center">
          <p className="text-silver-400">{t.readingsPage.emptyNotice}</p>
          <Button asChild className="mt-4">
            <Link href="/reading">{t.readingsPage.startFirstCta}</Link>
          </Button>
        </GlassPanel>
      ) : (
        <ul className="mt-8 space-y-3">
          {readings.map((reading) => (
            <li key={reading.id}>
              <Link href={`/readings/${reading.id}`}>
                <GlassPanel className="flex items-center justify-between gap-4 transition-colors hover:border-gold-400/40">
                  <div>
                    <p className="font-display text-lg text-silver-100">{spreadLabel(reading.spreadId, locale)}</p>
                    {reading.question && <p className="mt-1 text-sm italic text-silver-400">{reading.question}</p>}
                    <p className="mt-1 text-xs text-silver-500">{new Date(reading.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {reading.isFavorite && <Badge variant="gold">{t.readingsPage.favoriteBadge}</Badge>}
                    <span className="text-xs text-silver-500">{formatCardCount(reading.cardCount, locale)}</span>
                  </div>
                </GlassPanel>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {(numerologyReadings.length > 0 || astrologyReadings.length > 0) && (
        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          {numerologyReadings.length > 0 && (
            <section>
              <h2 className="font-display text-xl text-silver-100">{t.nav.numerology}</h2>
              <ul className="mt-3 space-y-2">
                {numerologyReadings.map((entry) => (
                  <li key={entry.id}>
                    <GlassPanel className="flex items-center justify-between gap-3" padding="sm">
                      <div>
                        <p className="text-sm text-silver-100">
                          {getNumberTypeLabels("lifePath", locale).label} {entry.number} — {getLifePathMeaning(entry.number, locale).title}
                        </p>
                        {entry.fullName && <p className="mt-0.5 text-xs text-silver-400">{entry.fullName}</p>}
                        <p className="text-xs text-silver-500">{new Date(entry.createdAt).toLocaleDateString()}</p>
                      </div>
                    </GlassPanel>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {astrologyReadings.length > 0 && (
            <section>
              <h2 className="font-display text-xl text-silver-100">{t.nav.astrology}</h2>
              <ul className="mt-3 space-y-2">
                {astrologyReadings.map((entry) => (
                  <li key={entry.id}>
                    <GlassPanel className="flex items-center justify-between gap-3" padding="sm">
                      <div>
                        <p className="text-sm text-silver-100">{zodiacLabel(entry.signId, locale)}</p>
                        <p className="text-xs text-silver-500">{new Date(entry.createdAt).toLocaleDateString()}</p>
                      </div>
                      {entry.sect && (
                        <Badge variant="violet">{entry.sect === "day" ? t.astrologyPage.sectDayLabel : t.astrologyPage.sectNightLabel}</Badge>
                      )}
                    </GlassPanel>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
