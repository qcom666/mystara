import type { SpreadCategory, TarotSpread } from "@/modules/tarot/domain/types";

export type PlanTier = "free" | "premium";

export interface UsageLimitPolicy {
  maxReadingsPerDay: number | null; // null = без ограничения
  allowedSpreadCategories: SpreadCategory[] | "all";
  allowPremiumSpreads: boolean;
  allowAIInterpretation: boolean;
}

export const PLAN_POLICIES: Record<PlanTier, UsageLimitPolicy> = {
  free: {
    maxReadingsPerDay: 3,
    allowedSpreadCategories: "all",
    allowPremiumSpreads: false,
    allowAIInterpretation: true,
  },
  premium: {
    maxReadingsPerDay: null,
    allowedSpreadCategories: "all",
    allowPremiumSpreads: true,
    allowAIInterpretation: true,
  },
};

export interface CanStartReadingInput {
  planTier: PlanTier;
  spread: Pick<TarotSpread, "isPremium" | "category">;
  /** Сколько раскладов пользователь уже начал сегодня (считается на сервере по строкам `Reading`). */
  readingsToday: number;
}

export interface EntitlementResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Чистая функция без доступа к БД и сессии, поэтому правила монетизации остаются пригодными
 * для модульных тестов, а подключение другого платёжного сервиса не затронет эту сигнатуру.
 */
export function canStartReading({ planTier, spread, readingsToday }: CanStartReadingInput): EntitlementResult {
  const policy = PLAN_POLICIES[planTier];

  if (spread.isPremium && !policy.allowPremiumSpreads) {
    return { allowed: false, reason: "This spread is available on the Premium plan." };
  }

  if (policy.maxReadingsPerDay !== null && readingsToday >= policy.maxReadingsPerDay) {
    return {
      allowed: false,
      reason: `You've reached today's limit of ${policy.maxReadingsPerDay} readings on the Free plan. Upgrade for unlimited readings.`,
    };
  }

  return { allowed: true };
}
