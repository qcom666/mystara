"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";
import { useTranslation } from "@/lib/i18n";
import { calculateSunSign } from "@/modules/astrology/services/calculate-sun-sign";
import { AstrologyInputForm, type AstrologyInputValue } from "./astrology-input-form";
import { AstrologyResult } from "./astrology-result";

export function AstrologyFlow() {
  const t = useTranslation();
  const [input, setInput] = useState<AstrologyInputValue | null>(null);

  function handleSubmit(value: AstrologyInputValue) {
    setInput(value);
    track({ name: "astrology_calculated", sunSign: calculateSunSign(value.birthDate).id });
  }

  // See numerology-flow.tsx for why the form and the result are separate
  // mutually-exclusive components rather than one with a conditional return
  // — each owns a useTelegramMainButton() call, and having both mounted at
  // once made them fight over Telegram's single MainButton.
  if (!input) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-gold-400">{t.astrologyPage.flowEyebrow}</p>
          <h1 className="mt-3 font-display text-3xl text-silver-50">{t.astrologyPage.flowTitle}</h1>
          <p className="mt-2 text-silver-400">{t.astrologyPage.flowSubtitle}</p>
        </div>
        <AstrologyInputForm onSubmit={handleSubmit} />
      </div>
    );
  }

  return <AstrologyResult birthDate={input.birthDate} sect={input.sect} onReset={() => setInput(null)} />;
}
