"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { SpreadPickerGrid } from "@/components/tarot/spread-picker-grid";
import { useTranslation } from "@/lib/i18n";
import type { PlanTier } from "@/modules/subscriptions/usage-limit.service";
import type { TarotSpread } from "@/modules/tarot/domain/types";

interface SpreadPickerPageProps {
  spreads: readonly TarotSpread[];
  planTier: PlanTier;
}

export function SpreadPickerPage({ spreads, planTier }: SpreadPickerPageProps) {
  const t = useTranslation();
  const router = useRouter();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="text-center">
        <h1 className="font-display text-3xl text-silver-50 sm:text-4xl">{t.reading.chooseSpreadTitle}</h1>
        <p className="mt-3 text-silver-400">{t.reading.chooseSpreadSubtitle}</p>
      </motion.div>

      <div className="mt-10">
        <SpreadPickerGrid
          spreads={spreads}
          isLocked={(spread) => spread.isPremium && planTier !== "premium"}
          onSelect={(spread) => router.push(`/reading/${spread.id}`)}
        />
      </div>
    </div>
  );
}
