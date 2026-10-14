"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { PrimaryActionBar } from "@/components/telegram/primary-action-bar";
import { GlassPanel } from "@/components/ui/glass-panel";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Sect } from "@/modules/astrology/domain/types";

export interface AstrologyInputValue {
  birthDate: Date;
  sect: Sect | null;
}

interface AstrologyInputFormProps {
  onSubmit: (value: AstrologyInputValue) => void;
}

const TODAY = new Date().toISOString().slice(0, 10);

export function AstrologyInputForm({ onSubmit }: AstrologyInputFormProps) {
  const t = useTranslation();
  const SECT_OPTIONS: { value: Sect | null; label: string }[] = [
    { value: "day", label: t.astrologyPage.sectDayLabel },
    { value: "night", label: t.astrologyPage.sectNightLabel },
    { value: null, label: t.astrologyPage.sectNotSureLabel },
  ];
  const [dateValue, setDateValue] = useState("");
  const [sect, setSect] = useState<Sect | null>(null);
  const [error, setError] = useState(false);

  function submit() {
    if (!dateValue) return;
    const birthDate = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(birthDate.getTime())) {
      setError(true);
      return;
    }
    setError(false);
    onSubmit({ birthDate, sect });
  }

  function handleFormSubmit(event: FormEvent) {
    event.preventDefault();
    submit();
  }


  return (
    <GlassPanel className="mx-auto w-full max-w-sm">
      <h1 className="font-display text-2xl text-silver-50">{t.common.detailsFormTitle}</h1>
      <p className="mt-1 text-sm text-silver-400">{t.astrologyPage.formSubtitle}</p>
      <form id="astrology-form" onSubmit={handleFormSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="birthDate">{t.common.dateOfBirthLabel}</Label>
          <DatePicker id="birthDate" required max={TODAY} value={dateValue} onChange={setDateValue} />
        </div>
        <div className="space-y-1.5">
          <Label>{t.astrologyPage.sectQuestionLabel}</Label>
          <div className="flex gap-2">
            {SECT_OPTIONS.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setSect(option.value)}
                className={cn(
                  "focus-ring flex-1 rounded-xl border px-3 py-2 text-sm transition-colors",
                  sect === option.value ? "border-gold-400/60 bg-gold-500/10 text-gold-300" : "border-silver-500/25 text-silver-400 hover:border-silver-500/50",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-silver-500">{t.astrologyPage.sectHint}</p>
        </div>
        {error && <p className="text-xs text-red-400">{t.common.invalidDateError}</p>}
        <PrimaryActionBar>
          <Button type="submit" form="astrology-form" className="w-full">
            {t.astrologyPage.revealCta}
          </Button>
        </PrimaryActionBar>
      </form>
    </GlassPanel>
  );
}
