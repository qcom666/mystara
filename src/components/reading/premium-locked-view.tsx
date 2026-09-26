"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useLocale, useTranslation } from "@/lib/i18n";
import { getSpreadDescription, getSpreadName } from "@/modules/tarot/domain/spreads.data";
import type { TarotSpread } from "@/modules/tarot/domain/types";

export function PremiumLockedView({ spread }: { spread: TarotSpread }) {
  const t = useTranslation();
  const { locale } = useLocale();

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <GlassPanel className="w-full">
        <h1 className="font-display text-2xl text-gold-300">{t.premiumLockedPage.title.replace("{name}", getSpreadName(spread, locale))}</h1>
        <p className="mt-3 text-sm text-silver-400">{getSpreadDescription(spread, locale)}</p>
        <p className="mt-3 text-sm text-silver-400">{t.premiumLockedPage.body}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/reading">{t.premiumLockedPage.chooseAnotherCta}</Link>
          </Button>
          <Button asChild>
            <Link href="/pricing">{t.premiumLockedPage.seePremiumCta}</Link>
          </Button>
        </div>
      </GlassPanel>
    </div>
  );
}
