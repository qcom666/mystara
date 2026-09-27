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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocale, useTranslation } from "@/lib/i18n";
import { getActorFunFactByLifePath } from "@/modules/fun-facts/services/actor-match.service";
import { getLifePathMeaning } from "@/modules/numerology/domain/life-path-meanings.data";
import { describeNumberForType, getNumberTypeLabels } from "@/modules/numerology/domain/number-type-framing";
import type { LifePathNumber, NumerologyNumberType, NumerologyProfile } from "@/modules/numerology/domain/types";
import { calculateBirthdayNumber, calculateLifePathNumber } from "@/modules/numerology/services/calculate-life-path";
import { isCyrillic } from "@/modules/numerology/domain/letter-values.data";
import { calculateNumerologyProfile, hasCalculableLetters } from "@/modules/numerology/services/calculate-name-numbers";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface NumerologyResultProps {
  fullName: string;
  birthDate: Date;
  onReset: () => void;
}

function NumberCard({ number, type }: { number: LifePathNumber; type: NumerologyNumberType }) {
  const { locale } = useLocale();
  const info = getNumberTypeLabels(type, locale);
  return (
    <GlassPanel>
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-silver-500">{info.label}</p>
          <p className="text-xs text-silver-500">{info.subtitle}</p>
        </div>
        <p className="font-display text-3xl text-gradient-gold">{number}</p>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-silver-300">{describeNumberForType(number, type, locale)}</p>
    </GlassPanel>
  );
}

function SystemProfile({ profile }: { profile: NumerologyProfile }) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <NumberCard number={profile.expressionNumber} type="expression" />
      <NumberCard number={profile.soulUrgeNumber} type="soulUrge" />
      <NumberCard number={profile.personalityNumber} type="personality" />
      <NumberCard number={profile.maturityNumber} type="maturity" />
    </div>
  );
}

export function NumerologyResult({ fullName, birthDate, onReset }: NumerologyResultProps) {
  const t = useTranslation();
  const { locale } = useLocale();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  // Not just "non-empty": a name with nothing calculable (digits, emoji, an
  // unsupported script) has no valid name-derived numbers to show.
  const hasName = hasCalculableLetters(fullName);
  const lifePathNumber = useMemo(() => calculateLifePathNumber(birthDate), [birthDate]);
  const birthdayNumber = useMemo(() => calculateBirthdayNumber(birthDate), [birthDate]);
  const lifePathMeaning = getLifePathMeaning(lifePathNumber, locale);

  const pythagorean = useMemo(
    () => (hasName ? calculateNumerologyProfile(fullName, birthDate, "pythagorean") : null),
    [hasName, fullName, birthDate],
  );
  const chaldean = useMemo(
    () => (hasName ? calculateNumerologyProfile(fullName, birthDate, "chaldean") : null),
    [hasName, fullName, birthDate],
  );

  const funFact = useMemo(() => getActorFunFactByLifePath(lifePathNumber, birthDate.toISOString(), locale), [lifePathNumber, birthDate, locale]);

  async function handleSave() {
    setSaveStatus("saving");
    try {
      const response = await fetch("/api/numerology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthDate: birthDate.toISOString().slice(0, 10),
          lifePathNumber,
          birthdayNumber,
          fullName: hasName ? fullName.trim() : null,
          pythagorean: pythagorean
            ? {
                expressionNumber: pythagorean.expressionNumber,
                soulUrgeNumber: pythagorean.soulUrgeNumber,
                personalityNumber: pythagorean.personalityNumber,
                maturityNumber: pythagorean.maturityNumber,
              }
            : null,
          chaldean: chaldean
            ? {
                expressionNumber: chaldean.expressionNumber,
                soulUrgeNumber: chaldean.soulUrgeNumber,
                personalityNumber: chaldean.personalityNumber,
                maturityNumber: chaldean.maturityNumber,
              }
            : null,
        }),
      });
      if (!response.ok) throw new Error("save_failed");
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }

  const isTelegram = useTelegramMainButton({
    text: isAuthenticated ? (saveStatus === "saving" ? t.common.loading : t.numerologyPage.saveResultCta) : t.numerologyPage.signInToSaveCta,
    onClick: isAuthenticated ? handleSave : () => {},
    visible: !(isAuthenticated && saveStatus === "saved"),
    disabled: saveStatus === "saving",
  });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-gold-400">{t.numerologyPage.eyebrow}</p>
        <p className="mt-3 font-display text-6xl text-gradient-gold">{lifePathMeaning.number}</p>
        <h1 className="mt-2 font-display text-3xl text-silver-50">{lifePathMeaning.title}</h1>
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {lifePathMeaning.keywords.map((keyword) => (
            <Badge key={keyword} variant="gold">
              {keyword}
            </Badge>
          ))}
        </div>
      </div>

      <GlassPanel className="mt-8">
        <p className="text-sm leading-relaxed text-silver-300">{lifePathMeaning.description}</p>
      </GlassPanel>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <GlassPanel>
          <h2 className="font-display text-lg text-silver-100">{t.common.strengths}</h2>
          <ul className="mt-2 space-y-1.5 text-sm text-silver-300">
            {lifePathMeaning.strengths.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </GlassPanel>
        <GlassPanel>
          <h2 className="font-display text-lg text-silver-100">{t.common.watchFor}</h2>
          <ul className="mt-2 space-y-1.5 text-sm text-silver-300">
            {lifePathMeaning.challenges.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </GlassPanel>
      </div>

      <div className="mt-4">
        <NumberCard number={birthdayNumber} type="birthday" />
      </div>

      {hasName && pythagorean && chaldean ? (
        <div className="mt-8">
          <h2 className="text-center font-display text-2xl text-silver-100">{t.numerologyPage.deeperNumbersTitle}</h2>
          <p className="mt-1 text-center text-sm text-silver-400">{t.numerologyPage.deeperNumbersSubtitle}</p>
          {isCyrillic(fullName) && <p className="mt-1 text-center text-xs text-silver-500">{t.numerologyPage.cyrillicNote}</p>}
          <Tabs defaultValue="pythagorean" className="mt-5 flex flex-col items-center">
            <TabsList>
              <TabsTrigger value="pythagorean">{t.numerologyPage.pythagoreanLabel}</TabsTrigger>
              <TabsTrigger value="chaldean">{t.numerologyPage.chaldeanLabel}</TabsTrigger>
            </TabsList>
            <TabsContent value="pythagorean" className="w-full">
              <SystemProfile profile={pythagorean} />
            </TabsContent>
            <TabsContent value="chaldean" className="w-full">
              <SystemProfile profile={chaldean} />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <GlassPanel className="mt-8 text-center">
          <p className="text-sm text-silver-400">{t.numerologyPage.addNameHint}</p>
        </GlassPanel>
      )}

      {funFact && (
        <div className="mt-4">
          <FunFactCard fact={funFact} />
        </div>
      )}

      <p className="mt-6 text-center text-xs text-silver-500">{t.numerologyPage.disclaimer}</p>

      <div className="mx-auto mt-6 max-w-sm text-center">
        {isAuthenticated ? (
          saveStatus === "saved" ? (
            <p className="text-sm text-gold-300">{t.numerologyPage.savedNotice}</p>
          ) : (
            !isTelegram && (
              <Button onClick={handleSave} disabled={saveStatus === "saving"}>
                {saveStatus === "saving" ? t.common.loading : t.numerologyPage.saveResultCta}
              </Button>
            )
          )
        ) : (
          <GlassPanel>
            <p className="text-sm text-silver-400">{t.numerologyPage.signInToSaveBody}</p>
            {!isTelegram && (
              <Button asChild variant="secondary" className="mt-3">
                <Link href="/login">{t.numerologyPage.signInToSaveCta}</Link>
              </Button>
            )}
          </GlassPanel>
        )}
        {saveStatus === "error" && <p className="mt-2 text-xs text-red-400">{t.errors.generic}</p>}
      </div>

      <div className="mt-6 text-center">
        <Button variant="ghost" onClick={onReset}>
          {t.numerologyPage.tryAnotherDate}
        </Button>
      </div>
    </motion.div>
  );
}
