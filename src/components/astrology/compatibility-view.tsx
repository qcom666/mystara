"use client";

import Link, { useLocalizedHref } from "@/components/shared/localized-link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useLocale, useTranslation } from "@/lib/i18n";
import type { ZodiacSignId } from "@/modules/astrology/domain/types";
import { getAllZodiacSigns, localizeZodiacSign } from "@/modules/astrology/domain/zodiac-signs.data";
import { type CompatibilityMode, compatibilityPath } from "@/modules/astrology/services/detailed-compatibility";

/** Символ знака текстом, а не цветным эмодзи (U+FE0E). */
const asText = (symbol: string) => `${symbol}\uFE0E`;

const SIGN_IDS = getAllZodiacSigns().map((sign) => sign.id);
const isSignId = (value: string | null): value is ZodiacSignId => value !== null && (SIGN_IDS as string[]).includes(value);

/**
 * Выбор двух знаков для любви или дружбы; `?sign=leo` в адресе подставляет первый знак (переход со страницы
 * гороскопа).
 */
export function CompatibilityPicker({
  initialFirst,
  initialSecond,
  mode = "love",
}: {
  initialFirst?: ZodiacSignId;
  initialSecond?: ZodiacSignId;
  mode?: CompatibilityMode;
}) {
  const t = useTranslation();
  const { locale } = useLocale();
  const router = useRouter();
  const localized = useLocalizedHref();
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
        router.push(localized(compatibilityPath(mode, first, second)));
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="compat-first">{t.compatibilityPage.yourSign}</Label>
        <Select id="compat-first" value={first} onChange={(event) => isSignId(event.target.value) && setFirst(event.target.value)}>
          {options}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="compat-second">{mode === "love" ? t.compatibilityPage.partnerSign : t.compatibilityPage.friendSign}</Label>
        <Select id="compat-second" value={second} onChange={(event) => isSignId(event.target.value) && setSecond(event.target.value)}>
          {options}
        </Select>
      </div>
      <Button type="submit">{t.compatibilityPage.show}</Button>
    </form>
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
