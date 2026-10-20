"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";
import { useTranslation } from "@/lib/i18n";
import { calculateLifePathNumber } from "@/modules/numerology/services/calculate-life-path";
import { NumerologyInputForm, type NumerologyInputValue } from "./numerology-input-form";
import { NumerologyResult } from "./numerology-result";
import { SplitWords } from "@/components/motion/reveal";

export function NumerologyFlow() {
  const t = useTranslation();
  const [input, setInput] = useState<NumerologyInputValue | null>(null);

  function handleSubmit(value: NumerologyInputValue) {
    setInput(value);
    track({ name: "numerology_calculated", lifePathNumber: calculateLifePathNumber(value.birthDate) });
  }

  if (!input) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-gold-400">{t.numerologyPage.flowEyebrow}</p>
          <h1 className="mt-3 font-display text-3xl text-silver-50"><SplitWords text={t.numerologyPage.flowTitle} immediate delay={0.1} /></h1>
          <p className="mt-2 text-silver-400">{t.numerologyPage.flowSubtitle}</p>
        </div>
        <NumerologyInputForm onSubmit={handleSubmit} />
      </div>
    );
  }

  return <NumerologyResult fullName={input.fullName} birthDate={input.birthDate} onReset={() => setInput(null)} />;
}
