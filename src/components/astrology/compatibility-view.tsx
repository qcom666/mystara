"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useLocale, useTranslation } from "@/lib/i18n";
import type { ZodiacSignId } from "@/modules/astrology/domain/types";
import { getAllZodiacSigns, getZodiacSignById, localizeZodiacSign } from "@/modules/astrology/domain/zodiac-signs.data";
import { type Compatibility, compatibilitySlug } from "@/modules/astrology/services/compatibility";

/** Символ знака текстом, а не цветным эмодзи (U+FE0E). */
const asText = (symbol: string) => `${symbol}\uFE0E`;

const SIGN_IDS = getAllZodiacSigns().map((sign) => sign.id);
const isSignId = (value: string | null): value is ZodiacSignId => value !== null && (SIGN_IDS as string[]).includes(value);

/** Выбор двух знаков; `?sign=leo` в адресе подставляет первый знак (переход со страницы гороскопа). */
export function CompatibilityPicker({ initialFirst, initialSecond }: { initialFirst?: ZodiacSignId; initialSecond?: ZodiacSignId }) {
  const t = useTranslation();
  const { locale } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromQuery = searchParams.get("sign");
  const [first, setFirst] = useState<ZodiacSignId>(initialFirst ?? (isSignId(fromQuery) ? fromQuery : "aries"));
  const [second, setSecond] = useState<ZodiacSignId>(initialSecond ?? "libra");

  const options = getAllZodiacSigns().map((base) => {
    const sign = localizeZodiacSign(base, locale);
    return (
      <option key={sign.id} value={sign.id}>
        {asText(sign.symbol)} {sign.name}
      </option>
    );
  });

  return (
    <form
      className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        router.push(`/astrology/compatibility/${compatibilitySlug(first, second)}`);
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="compat-first">{t.compatibilityPage.yourSign}</Label>
        <Select id="compat-first" value={first} onChange={(event) => isSignId(event.target.value) && setFirst(event.target.value)}>
          {options}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="compat-second">{t.compatibilityPage.partnerSign}</Label>
        <Select id="compat-second" value={second} onChange={(event) => isSignId(event.target.value) && setSecond(event.target.value)}>
          {options}
        </Select>
      </div>
      <Button type="submit">{t.compatibilityPage.show}</Button>
    </form>
  );
}

export function CompatibilityIntro() {
  const t = useTranslation();
  return (
    <div className="text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-gold-400">{t.compatibilityPage.eyebrow}</p>
      <h1 className="mt-2 font-display text-3xl text-silver-50 sm:text-4xl">{t.compatibilityPage.title}</h1>
      <p className="mx-auto mt-3 max-w-xl text-sm text-silver-400">{t.compatibilityPage.subtitle}</p>
    </div>
  );
}

function ScoreBar({ label, value, large = false }: { label: string; value: number; large?: boolean }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className={large ? "font-display text-lg text-silver-100" : "text-sm text-silver-300"}>{label}</span>
        <span className={large ? "font-display text-2xl text-gold-300" : "text-sm text-gold-300"}>{value}%</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-midnight-700" role="presentation">
        <div className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-600" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

/** Результат для пары знаков. */
export function CompatibilityResult({ result }: { result: Compatibility }) {
  const t = useTranslation();
  const { locale } = useLocale();
  const baseFirst = getZodiacSignById(result.first);
  const baseSecond = getZodiacSignById(result.second);
  if (!baseFirst || !baseSecond) return null;
  const first = localizeZodiacSign(baseFirst, locale);
  const second = localizeZodiacSign(baseSecond, locale);

  return (
    <div>
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-gold-400">{t.compatibilityPage.eyebrow}</p>
        <p className="mt-3 font-display text-5xl text-gradient-gold">
          {asText(first.symbol)} {asText(second.symbol)}
        </p>
        <h1 className="mt-2 font-display text-3xl text-silver-50">
          {t.compatibilityPage.pairTitle.replace("{first}", first.name).replace("{second}", second.name)}
        </h1>
        <p className="mt-2 text-sm text-gold-300">{result.title[locale]}</p>
      </div>

      <GlassPanel className="mt-8 space-y-4">
        <ScoreBar label={t.compatibilityPage.scores.overall} value={result.scores.overall} large />
        <ScoreBar label={t.compatibilityPage.scores.love} value={result.scores.love} />
        <ScoreBar label={t.compatibilityPage.scores.friendship} value={result.scores.friendship} />
        <ScoreBar label={t.compatibilityPage.scores.work} value={result.scores.work} />
      </GlassPanel>

      <GlassPanel className="mt-4">
        <p className="text-sm leading-relaxed text-silver-300">{result.summary[locale]}</p>
      </GlassPanel>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <GlassPanel>
          <h2 className="font-display text-lg text-silver-100">{t.compatibilityPage.elementsHeading}</h2>
          <p className="mt-1 text-xs text-silver-500">
            {t.astrologyTerms.elements[first.element]} + {t.astrologyTerms.elements[second.element]}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-silver-300">{result.elements[locale]}</p>
        </GlassPanel>
        <GlassPanel>
          <h2 className="font-display text-lg text-silver-100">{t.compatibilityPage.modalitiesHeading}</h2>
          <p className="mt-1 text-xs text-silver-500">
            {t.astrologyTerms.modalities[first.modality]} + {t.astrologyTerms.modalities[second.modality]}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-silver-300">{result.modalities[locale]}</p>
        </GlassPanel>
      </div>

      <GlassPanel className="mt-4">
        <h2 className="font-display text-lg text-silver-100">{t.compatibilityPage.adviceHeading}</h2>
        <p className="mt-2 text-sm leading-relaxed text-silver-300">{result.advice[locale]}</p>
      </GlassPanel>

      <p className="mt-6 text-center text-xs text-silver-500">
        {t.compatibilityPage.note} {t.astrologyPage.disclaimer}
      </p>
    </div>
  );
}

export function CompatibilityFooterLinks() {
  const t = useTranslation();
  return (
    <div className="mt-6 flex flex-wrap justify-center gap-3">
      <Button asChild variant="ghost">
        <Link href="/astrology/horoscope">{t.compatibilityPage.horoscopeCta}</Link>
      </Button>
    </div>
  );
}

export function AnotherPairHeading() {
  const t = useTranslation();
  return <h2 className="mb-4 text-center font-display text-lg text-silver-100">{t.compatibilityPage.anotherPair}</h2>;
}
