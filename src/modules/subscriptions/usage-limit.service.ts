import type { SpreadCategory, TarotSpread } from "@/modules/tarot/domain/types";

export type PlanTier = "free" | "premium";

export interface UsageLimitPolicy {
  maxReadingsPerDay: number | null; // null = unlimited
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
  /** Number of readings the user has already started today (server-derived from `Reading` rows). */
  readingsToday: number;
}

export interface EntitlementResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Pure function — no DB/session access — so monetization rules stay unit
 * testable and swapping in Stripe later never touches this signature.
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
