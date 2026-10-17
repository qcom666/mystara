"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CardDetailContent } from "@/components/tarot/card-detail-content";
import { FlippableCard } from "@/components/tarot/flippable-card";
import { SpreadLayout } from "@/components/tarot/spread-layout";
import { Button } from "@/components/ui/button";
import { PrimaryActionBar } from "@/components/telegram/primary-action-bar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { GlassPanel } from "@/components/ui/glass-panel";
import { FunFactCard } from "@/components/shared/fun-fact-card";
import { track } from "@/lib/analytics";
import { useLocale, useTranslation } from "@/lib/i18n";
import { getActorFunFactByReading } from "@/modules/fun-facts/services/actor-match.service";
import { getCardName } from "@/modules/tarot/domain/deck";
import { getSpreadName } from "@/modules/tarot/domain/spreads.data";
import type { DrawnCard, TarotSpread } from "@/modules/tarot/domain/types";
import { useReadingFlowStore } from "@/store/reading-flow.store";
import { AIInterpretationPanel } from "./ai-interpretation-panel";
import { ShareReadingButton } from "./share-reading-button";

interface ResultStepProps {
  spread: TarotSpread;
  isAuthenticated: boolean;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function ResultStep({ spread, isAuthenticated }: ResultStepProps) {
  // Встроенный генератор по шаблонам («mock») не ИИ, поэтому подпись заслуживает только настоящая модель.
  const aiProvider = useReadingFlowStore((s) => s.aiResult?.provider);
  const t = useTranslation();
  const interpretationHeading = aiProvider && aiProvider !== "mock" ? t.reading.aiInterpretationTitle : t.reading.interpretationTitle;
  const { locale } = useLocale();
  const router = useRouter();
  const drawnCards = useReadingFlowStore((s) => s.drawnCards);
  const question = useReadingFlowStore((s) => s.question);
  const seed = useReadingFlowStore((s) => s.seed);
  const aiResult = useReadingFlowStore((s) => s.aiResult);
  const savedReadingId = useReadingFlowStore((s) => s.savedReadingId);
  const setSavedReadingId = useReadingFlowStore((s) => s.setSavedReadingId);
  const reset = useReadingFlowStore((s) => s.reset);

  const [activeCard, setActiveCard] = useState<DrawnCard | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const funFact = useMemo(() => (seed ? getActorFunFactByReading(drawnCards, seed, locale) : null), [drawnCards, seed, locale]);

  async function handleSave() {
    if (!seed) return;
    setSaveStatus("saving");
    try {
      const response = await fetch("/api/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spreadId: spread.id,
          question: question || null,
          seed,
          cards: drawnCards.map((drawn, index) => ({
            cardId: drawn.card.id,
            positionId: drawn.position.id,
            orientation: drawn.orientation,
            order: index,
          })),
          aiInterpretation: aiResult ?? undefined,
        }),
      });
      if (!response.ok) throw new Error("save_failed");
      const data = await response.json();
      setSavedReadingId(data.reading.id);
      setSaveStatus("saved");
      track({ name: "reading_saved", readingId: data.reading.id });
    } catch {
      setSaveStatus("error");
    }
  }

  function handleNewReading() {
    reset();
    router.push("/reading");
  }


  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-gold-400">{getSpreadName(spread, locale)}</p>
        {question && <p className="mx-auto mt-3 max-w-md text-sm italic text-silver-400">{`“${question}”`}</p>}
      </div>

      <div className="mt-10">
        <SpreadLayout
          spread={spread}
          cards={drawnCards}
          renderCard={(drawn) => (
            <button
              type="button"
              onClick={() => setActiveCard(drawn)}
              aria-label={`${t.reading.viewDetailsFor} ${getCardName(drawn.card, locale)}${drawn.orientation === "reversed" ? ` (${t.reading.reversed.toLowerCase()})` : ""}`}
              className="focus-ring block w-full"
            >
              <FlippableCard card={drawn.card} orientation={drawn.orientation} revealed interactive={false} />
            </button>
          )}
        />
      </div>

      <div className="mx-auto mt-12 max-w-2xl">
        <h2 className="text-center font-display text-2xl text-silver-100">{interpretationHeading}</h2>
        <div className="mt-5">
          <AIInterpretationPanel spread={spread} question={question} cards={drawnCards} />
        </div>
        {funFact && (
          <div className="mt-5">
            <FunFactCard fact={funFact} />
          </div>
        )}
      </div>

      <div className="mx-auto mt-10 max-w-md text-center">
        {isAuthenticated ? (
          savedReadingId ? (
            <GlassPanel>
              <p className="text-sm text-gold-300">{t.reading.savedReadingNotice}</p>
              <Button asChild variant="secondary" className="mt-3">
                <Link href={`/readings/${savedReadingId}`}>{t.reading.viewInHistoryCta}</Link>
              </Button>
            </GlassPanel>
          ) : (
            <PrimaryActionBar>
              <Button size="lg" onClick={handleSave} disabled={saveStatus === "saving"}>
                {saveStatus === "saving" ? t.common.loading : t.reading.saveReadingCta}
              </Button>
            </PrimaryActionBar>
          )
        ) : (
          <GlassPanel>
            <p className="text-sm text-silver-400">{t.reading.guestNotice}</p>
            <PrimaryActionBar className="mt-3">
              <Button asChild variant="secondary">
                <Link href="/login">{t.reading.signInToSaveCta}</Link>
              </Button>
            </PrimaryActionBar>
          </GlassPanel>
        )}
        {saveStatus === "error" && <p className="mt-2 text-xs text-red-400">{t.errors.generic}</p>}

        <div>
          <ShareReadingButton spreadId={spread.id} spreadName={getSpreadName(spread, locale)} cards={drawnCards} />
        </div>

        <Button variant="ghost" className="mt-4" onClick={handleNewReading}>
          {t.reading.newReadingCta}
        </Button>
      </div>

      <Dialog open={Boolean(activeCard)} onOpenChange={(open) => !open && setActiveCard(null)}>
        <DialogContent>
          {activeCard && (
            <>
              <DialogTitle className="sr-only">{getCardName(activeCard.card, locale)}</DialogTitle>
              <CardDetailContent card={activeCard.card} orientation={activeCard.orientation} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
