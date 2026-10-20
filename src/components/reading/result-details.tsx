"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import Link, { useLocalizedHref } from "@/components/shared/localized-link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { PremiumOffer } from "@/components/marketing/premium-offer";
import { EASE_OUT } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { PrimaryActionBar } from "@/components/telegram/primary-action-bar";
import { GlassPanel } from "@/components/ui/glass-panel";
import { FunFactCard } from "@/components/shared/fun-fact-card";
import { track } from "@/lib/analytics";
import { useLocale, useTranslation } from "@/lib/i18n";
import { getActorFunFactByReading } from "@/modules/fun-facts/services/actor-match.service";
import { getSpreadName } from "@/modules/tarot/domain/spreads.data";
import type { TarotSpread } from "@/modules/tarot/domain/types";
import { useReadingFlowStore } from "@/store/reading-flow.store";
import { AIInterpretationPanel } from "./ai-interpretation-panel";
import { ShareReadingButton } from "./share-reading-button";

interface ResultDetailsProps {
  spread: TarotSpread;
  isAuthenticated: boolean;
}

type SaveStatus = "idle" | "saving" | "saved" | "error" | "limit";

const detailsVariants: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.18, delayChildren: 0.35 } } };
const riseVariants: Variants = {
  hidden: { opacity: 0, y: 36, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: EASE_OUT } },
};

/**
 * Всё, что идёт под картами после «Продолжить»: толкование, интересный факт, сохранение, «поделиться» и
 * новый расклад. Блоки поднимаются по очереди, а страница плавно доезжает до толкования. Сами карты
 * остаются на столе (TableStep) и заново не раздаются.
 */
export function ResultDetails({ spread, isAuthenticated }: ResultDetailsProps) {
  // Встроенный генератор по шаблонам («mock») не ИИ, поэтому подпись заслуживает только настоящая модель.
  const aiProvider = useReadingFlowStore((s) => s.aiResult?.provider);
  const t = useTranslation();
  const interpretationHeading = aiProvider && aiProvider !== "mock" ? t.reading.aiInterpretationTitle : t.reading.interpretationTitle;
  const { locale } = useLocale();
  const router = useRouter();
  const localizeReading = useLocalizedHref();
  const drawnCards = useReadingFlowStore((s) => s.drawnCards);
  const question = useReadingFlowStore((s) => s.question);
  const seed = useReadingFlowStore((s) => s.seed);
  const aiResult = useReadingFlowStore((s) => s.aiResult);
  const savedReadingId = useReadingFlowStore((s) => s.savedReadingId);
  const setSavedReadingId = useReadingFlowStore((s) => s.setSavedReadingId);
  const reset = useReadingFlowStore((s) => s.reset);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const reduceMotion = useReducedMotion();

  // Доезжаем до толкования, когда карты уже «поприветствовали» переход золотой волной.
  useEffect(() => {
    const timer = window.setTimeout(
      () => headingRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" }),
      reduceMotion ? 0 : 450,
    );
    return () => window.clearTimeout(timer);
    // Один раз при появлении результата.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      if (response.status === 403 && ((await response.json().catch(() => null)) as { error?: string } | null)?.error === "limit_reached") {
        setSaveStatus("limit");
        return;
      }
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
    router.push(localizeReading("/reading"));
  }


  return (
    <motion.div variants={detailsVariants} initial="hidden" animate="show">
      <motion.div data-reveal variants={riseVariants} className="mx-auto mt-12 max-w-2xl">
        <h2 ref={headingRef} className="scroll-mt-24 text-center font-display text-2xl text-silver-100 sm:text-3xl">
          <span className="text-shimmer-gold">{interpretationHeading}</span>
        </h2>
        <div className="mt-5">
          <AIInterpretationPanel spread={spread} question={question} cards={drawnCards} />
        </div>
        {funFact && (
          <div className="mt-5">
            <FunFactCard fact={funFact} />
          </div>
        )}
      </motion.div>

      <PremiumOffer className="mt-14" />

      <motion.div data-reveal variants={riseVariants} className="mx-auto mt-10 max-w-md text-center">
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
        {saveStatus === "limit" && (
          <p className="mt-2 text-xs text-gold-300">
            {t.reading.saveLimitReached}{" "}
            <Link href="/pricing" className="underline underline-offset-2">
              {t.reading.saveLimitCta}
            </Link>
          </p>
        )}

        <div>
          <ShareReadingButton spreadId={spread.id} spreadName={getSpreadName(spread, locale)} cards={drawnCards} />
        </div>

        <Button variant="ghost" className="mt-4" onClick={handleNewReading}>
          {t.reading.newReadingCta}
        </Button>
      </motion.div>
    </motion.div>
  );
}
