"use client";

import { Lock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GlassPanel } from "@/components/ui/glass-panel";
import { formatCardCount, useLocale, useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getSpreadDescription, getSpreadName } from "@/modules/tarot/domain/spreads.data";
import type { TarotSpread } from "@/modules/tarot/domain/types";

interface SpreadPickerGridProps {
  spreads: readonly TarotSpread[];
  onSelect: (spread: TarotSpread) => void;
  isLocked?: (spread: TarotSpread) => boolean;
}

export function SpreadPickerGrid({ spreads, onSelect, isLocked }: SpreadPickerGridProps) {
  const t = useTranslation();
  const { locale } = useLocale();
  const difficultyLabel: Record<TarotSpread["difficulty"], string> = {
    beginner: t.common.difficulty.beginner,
    intermediate: t.common.difficulty.intermediate,
    advanced: t.common.difficulty.advanced,
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {spreads.map((spread) => {
        const locked = isLocked?.(spread) ?? false;
        return (
          <button
            key={spread.id}
            type="button"
            onClick={() => onSelect(spread)}
            aria-label={`${getSpreadName(spread, locale)}${locked ? t.common.premiumLockedSuffix : ""}`}
            className="focus-ring text-left"
          >
            <GlassPanel
              className={cn(
                "group h-full transition-all duration-200 hover:border-gold-400/40 hover:shadow-[0_0_30px_-10px_rgba(212,175,55,0.4)]",
                locked && "opacity-70",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-xl text-silver-100 group-hover:text-gold-300">{getSpreadName(spread, locale)}</h3>
                {spread.isPremium && (
                  <Badge variant="gold" className="shrink-0">
                    {locked ? <Lock className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                    {t.common.premiumBadge}
                  </Badge>
                )}
              </div>
              <p className="mt-2 text-sm text-silver-400">{getSpreadDescription(spread, locale)}</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-silver-500">
                <span>{formatCardCount(spread.cardCount, locale)}</span>
                <span aria-hidden="true">·</span>
                <span>{difficultyLabel[spread.difficulty]}</span>
              </div>
            </GlassPanel>
          </button>
        );
      })}
    </div>
  );
}
