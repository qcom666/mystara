"use client";

import { Sparkles } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useTranslation } from "@/lib/i18n";
import type { ActorFunFact } from "@/modules/fun-facts/domain/types";

interface FunFactCardProps {
  fact: ActorFunFact | null;
}

/**
 * Намеренно подаётся как занимательный факт, а не как знание: ничто в продукте не должно читаться
 * как утверждение о реальном человеке, даже в такой лёгкой функции.
 */
export function FunFactCard({ fact }: FunFactCardProps) {
  const t = useTranslation();
  if (!fact) return null;

  return (
    <GlassPanel className="border-violet-500/25">
      <div className="flex items-center gap-2 text-violet-300">
        <Sparkles className="h-4 w-4" />
        <span className="text-xs uppercase tracking-wide">{t.funFact.label}</span>
      </div>
      <p className="mt-2 text-sm text-silver-300">{fact.reason}</p>
      <p className="mt-1 text-xs text-silver-500">{t.funFact.disclaimer}</p>
    </GlassPanel>
  );
}
