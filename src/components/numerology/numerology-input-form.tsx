"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { PrimaryActionBar } from "@/components/telegram/primary-action-bar";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";

export interface NumerologyInputValue {
  fullName: string;
  birthDate: Date;
}

interface NumerologyInputFormProps {
  onSubmit: (value: NumerologyInputValue) => void;
}

const TODAY = new Date().toISOString().slice(0, 10);

export function NumerologyInputForm({ onSubmit }: NumerologyInputFormProps) {
  const t = useTranslation();
  const [fullName, setFullName] = useState("");
  const [dateValue, setDateValue] = useState("");
  const [error, setError] = useState(false);

  function submit() {
    if (!dateValue) return;
    const birthDate = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(birthDate.getTime())) {
      setError(true);
      return;
    }
    setError(false);
    onSubmit({ fullName: fullName.trim(), birthDate });
  }

  function handleFormSubmit(event: FormEvent) {
    event.preventDefault();
    submit();
  }


  return (
    <GlassPanel className="mx-auto w-full max-w-sm">
      <h1 className="font-display text-2xl text-silver-50">{t.common.detailsFormTitle}</h1>
      <p className="mt-1 text-sm text-silver-400">{t.numerologyPage.formSubtitle}</p>
      <form id="numerology-form" onSubmit={handleFormSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">{t.numerologyPage.fullNameLabel}</Label>
          <Input
            id="fullName"
            type="text"
            placeholder={t.numerologyPage.fullNamePlaceholder}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="birthDate">{t.common.dateOfBirthLabel}</Label>
          <Input id="birthDate" type="date" required max={TODAY} value={dateValue} onChange={(event) => setDateValue(event.target.value)} />
        </div>
        {error && <p className="text-xs text-red-400">{t.common.invalidDateError}</p>}
        <PrimaryActionBar>
          <Button type="submit" form="numerology-form" className="w-full">
            {t.numerologyPage.calculateCta}
          </Button>
        </PrimaryActionBar>
      </form>
      <p className="mt-4 text-xs text-silver-500">{t.numerologyPage.privacyHint}</p>
    </GlassPanel>
  );
}
