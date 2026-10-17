"use client";

import Link from "@/components/shared/localized-link";
import { FavoriteToggle } from "@/components/reading/favorite-toggle";
import { CardDetailContent } from "@/components/tarot/card-detail-content";
import { SpreadLayout } from "@/components/tarot/spread-layout";
import { TarotCardFace } from "@/components/tarot/tarot-card-face";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useLocale, useTranslation } from "@/lib/i18n";
import { getCardName } from "@/modules/tarot/domain/deck";
import { getSpreadName } from "@/modules/tarot/domain/spreads.data";
import type { DrawnCard, TarotSpread } from "@/modules/tarot/domain/types";

interface InterpretationSummary {
  overall: string;
  advice: string[];
  challenges: string[];
}

interface ReadingDetailViewProps {
  readingId: string;
  spread: TarotSpread;
  question: string | null;
  createdAt: string;
  isFavorite: boolean;
  drawnCards: DrawnCard[];
  interpretation: InterpretationSummary | null;
}

export function ReadingDetailView({ readingId, spread, question, createdAt, isFavorite, drawnCards, interpretation }: ReadingDetailViewProps) {
  const t = useTranslation();
  const { locale } = useLocale();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <Link href="/readings" className="text-sm text-silver-400 hover:text-gold-300">
        ← {t.readingDetailPage.backToReadings}
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold-400">{getSpreadName(spread, locale)}</p>
          {question && <p className="mt-2 text-lg italic text-silver-300">{`“${question}”`}</p>}
          <p className="mt-1 text-xs text-silver-500">{new Date(createdAt).toLocaleString()}</p>
        </div>
        <FavoriteToggle readingId={readingId} initialFavorite={isFavorite} />
      </div>

      <div className="mt-10">
        <SpreadLayout
          spread={spread}
          cards={drawnCards}
          renderCard={(drawn) => (
            <Dialog>
              <DialogTrigger asChild>
                <button type="button" className="focus-ring block w-full">
                  <TarotCardFace
                    card={drawn.card}
                    orientation={drawn.orientation}
                    locale={locale}
                    className={`card-glow w-full ${drawn.orientation === "reversed" ? "rotate-180" : ""}`}
                  />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle className="sr-only">{getCardName(drawn.card, locale)}</DialogTitle>
                <CardDetailContent card={drawn.card} orientation={drawn.orientation} />
              </DialogContent>
            </Dialog>
          )}
        />
      </div>

      {interpretation && (
        <div className="mx-auto mt-12 max-w-2xl space-y-5">
          <h2 className="text-center font-display text-2xl text-silver-100">{t.reading.interpretationTitle}</h2>
          <GlassPanel>
            <p className="text-sm leading-relaxed text-silver-300">{interpretation.overall}</p>
          </GlassPanel>
          <div className="grid gap-4 sm:grid-cols-2">
            <GlassPanel>
              <h3 className="font-display text-lg text-silver-100">{t.reading.adviceTitle}</h3>
              <ul className="mt-2 space-y-2 text-sm text-silver-300">
                {interpretation.advice.map((line) => (
                  <li key={line}>• {line}</li>
                ))}
              </ul>
            </GlassPanel>
            <GlassPanel>
              <h3 className="font-display text-lg text-silver-100">{t.reading.challengesTitle}</h3>
              <ul className="mt-2 space-y-2 text-sm text-silver-300">
                {interpretation.challenges.map((line) => (
                  <li key={line}>• {line}</li>
                ))}
              </ul>
            </GlassPanel>
          </div>
        </div>
      )}
    </div>
  );
}
