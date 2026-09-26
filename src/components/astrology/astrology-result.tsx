"use client";

import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { FunFactCard } from "@/components/shared/fun-fact-card";
import { useTelegramMainButton } from "@/components/telegram/use-telegram-main-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useLocale, useTranslation } from "@/lib/i18n";
import { getSectMercuryNote, getSectProfile, localizeSectProfile } from "@/modules/astrology/domain/sect.data";
import type { Sect } from "@/modules/astrology/domain/types";
import { localizeZodiacSign } from "@/modules/astrology/domain/zodiac-signs.data";
import { calculateSunSign } from "@/modules/astrology/services/calculate-sun-sign";
import { getActorFunFactByZodiac } from "@/modules/fun-facts/services/actor-match.service";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface AstrologyResultProps {
  birthDate: Date;
  sect: Sect | null;
  onReset: () => void;
}

export function AstrologyResult({ birthDate, sect, onReset }: AstrologyResultProps) {
  const t = useTranslation();
  const { locale } = useLocale();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const baseSign = useMemo(() => calculateSunSign(birthDate), [birthDate]);
  const sign = useMemo(() => localizeZodiacSign(baseSign, locale), [baseSign, locale]);
  const funFact = useMemo(() => getActorFunFactByZodiac(baseSign.id, birthDate.toISOString(), locale), [baseSign, birthDate, locale]);
  const sectProfile = useMemo(() => (sect ? localizeSectProfile(getSectProfile(sect), locale) : null), [sect, locale]);
  const planetName = (planet: string) => (t.astrologyTerms.planets as Record<string, string>)[planet] ?? planet;

  async function handleSave() {
    setSaveStatus("saving");
    try {
      const response = await fetch("/api/astrology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthDate: birthDate.toISOString().slice(0, 10), sunSign: sign.id }),
      });
      if (!response.ok) throw new Error("save_failed");
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }

  const isTelegram = useTelegramMainButton({
    text: isAuthenticated ? (saveStatus === "saving" ? t.common.loading : t.astrologyPage.saveResultCta) : t.astrologyPage.signInToSaveCta,
    onClick: isAuthenticated ? handleSave : () => {},
    visible: !(isAuthenticated && saveStatus === "saved"),
    disabled: saveStatus === "saving",
  });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-gold-400">{t.astrologyPage.eyebrow}</p>
        <p className="mt-3 font-display text-6xl text-gradient-gold">{sign.symbol}</p>
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

      {sectProfile && (
        <GlassPanel className="mt-4">
          <p className="text-xs uppercase tracking-[0.2em] text-gold-400">{t.astrologyPage.sectEyebrow}</p>
          <h2 className="mt-1 font-display text-lg text-silver-100">{sectProfile.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-silver-300">{sectProfile.description}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {sectProfile.favoredPlanets.map((planet) => (
              <Badge key={planet} variant="violet">
                {planetName(planet)}
              </Badge>
            ))}
          </div>
          <p className="mt-3 text-sm text-silver-300">{sectProfile.keynote}</p>
          <p className="mt-3 text-xs text-silver-500">{getSectMercuryNote(locale)}</p>
        </GlassPanel>
      )}

      {funFact && (
        <div className="mt-4">
          <FunFactCard fact={funFact} />
        </div>
      )}

      <p className="mt-6 text-center text-xs text-silver-500">{t.astrologyPage.disclaimer}</p>

      <div className="mx-auto mt-6 max-w-sm text-center">
        {isAuthenticated ? (
          saveStatus === "saved" ? (
            <p className="text-sm text-gold-300">{t.astrologyPage.savedNotice}</p>
          ) : (
            !isTelegram && (
              <Button onClick={handleSave} disabled={saveStatus === "saving"}>
                {saveStatus === "saving" ? t.common.loading : t.astrologyPage.saveResultCta}
              </Button>
            )
          )
        ) : (
          <GlassPanel>
            <p className="text-sm text-silver-400">{t.astrologyPage.signInToSaveBody}</p>
            {!isTelegram && (
              <Button asChild variant="secondary" className="mt-3">
                <Link href="/login">{t.astrologyPage.signInToSaveCta}</Link>
              </Button>
            )}
          </GlassPanel>
        )}
        {saveStatus === "error" && <p className="mt-2 text-xs text-red-400">{t.errors.generic}</p>}
      </div>

      <div className="mt-6 text-center">
        <Button variant="ghost" onClick={onReset}>
          {t.astrologyPage.tryAnotherDate}
        </Button>
      </div>
    </motion.div>
  );
}
