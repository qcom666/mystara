"use client";

import { useMemo } from "react";
import { AstrologyResult } from "@/components/astrology/astrology-result";
import { NumerologyResult } from "@/components/numerology/numerology-result";
import type { Sect } from "@/modules/astrology/domain/types";

/**
 * Дата рождения приходит строкой «ГГГГ-ММ-ДД» и превращается в полночь по местному времени уже в браузере:
 * так же её создаёт форма ввода, поэтому расчёт совпадает с тем, что человек видел при сохранении, в
 * каком бы часовом поясе он ни открыл страницу.
 */
function useLocalDate(ymd: string): Date {
  return useMemo(() => new Date(`${ymd}T00:00:00`), [ymd]);
}

export function SavedNumerologyView({ birthDate, fullName }: { birthDate: string; fullName: string }) {
  return <NumerologyResult fullName={fullName} birthDate={useLocalDate(birthDate)} saved />;
}

export function SavedAstrologyView({ birthDate, sect }: { birthDate: string; sect: Sect | null }) {
  return <AstrologyResult birthDate={useLocalDate(birthDate)} sect={sect} saved />;
}
