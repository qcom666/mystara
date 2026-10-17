import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { extendPremiumPeriodEnd } from "@/modules/subscriptions/premium";

export type PromoKind = "natal_credits" | "premium_days";

/** Код в верхнем регистре: буквы, цифры и дефис, 3-32 символа. */
export function normalizePromoCode(input: string): string | null {
  const code = input.trim().toUpperCase();
  return /^[A-Z0-9-]{3,32}$/.test(code) ? code : null;
}

export type RedeemResult =
  | { ok: true; kind: PromoKind; amount: number }
  | { ok: false; error: "not_found" | "inactive" | "expired" | "exhausted" | "already_used" | "invalid_code" };

/**
 * Активирует промокод: один раз на пользователя, в пределах общего лимита и срока. Строка промокода
 * блокируется на время транзакции, поэтому последний свободный код не достанется двоим.
 */
export async function redeemPromoCode(userId: string, rawCode: string, now: Date = new Date()): Promise<RedeemResult> {
  const code = normalizePromoCode(rawCode);
  if (!code) return { ok: false, error: "invalid_code" };
  try {
    return await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM "PromoCode" WHERE code = ${code} FOR UPDATE`;
      if (locked.length === 0) return { ok: false, error: "not_found" } as const;
      const promo = await tx.promoCode.findUnique({ where: { code } });
      if (!promo) return { ok: false, error: "not_found" } as const;
      // Сначала «уже активирован»: тому, кто ввёл код повторно, это понятнее, чем «лимит исчерпан».
      const used = await tx.promoRedemption.findUnique({ where: { promoCodeId_userId: { promoCodeId: promo.id, userId } }, select: { id: true } });
      if (used) return { ok: false, error: "already_used" } as const;
      if (!promo.active) return { ok: false, error: "inactive" } as const;
      if (promo.expiresAt && promo.expiresAt.getTime() <= now.getTime()) return { ok: false, error: "expired" } as const;
      if (promo.maxRedemptions !== null && promo.redemptionsCount >= promo.maxRedemptions) return { ok: false, error: "exhausted" } as const;

      await tx.promoRedemption.create({ data: { promoCodeId: promo.id, userId } });
      await tx.promoCode.update({ where: { id: promo.id }, data: { redemptionsCount: { increment: 1 } } });

      const kind = promo.kind as PromoKind;
      if (kind === "natal_credits") {
        await tx.user.update({ where: { id: userId }, data: { natalChartCredits: { increment: promo.amount } } });
      } else {
        await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
        const existing = await tx.subscription.findUnique({ where: { userId } });
        const currentPeriodEnd = extendPremiumPeriodEnd(existing?.currentPeriodEnd ?? null, now, promo.amount);
        const data = { tier: "PREMIUM" as const, status: "ACTIVE" as const, provider: "promo", externalId: promo.code, currentPeriodEnd };
        await tx.subscription.upsert({ where: { userId }, create: { userId, ...data }, update: data });
      }
      return { ok: true, kind, amount: promo.amount } as const;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { ok: false, error: "already_used" };
    throw error;
  }
}

export interface CreatePromoInput {
  code: string;
  kind: PromoKind;
  amount: number;
  maxRedemptions: number | null;
  expiresAt: Date | null;
  note: string | null;
  createdBy: string;
}

export async function createPromoCode(input: CreatePromoInput): Promise<"ok" | "invalid_code" | "code_taken"> {
  const code = normalizePromoCode(input.code);
  if (!code) return "invalid_code";
  try {
    await prisma.promoCode.create({ data: { ...input, code } });
    return "ok";
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return "code_taken";
    throw error;
  }
}

export async function listPromoCodes() {
  return prisma.promoCode.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
}

export async function setPromoCodeActive(id: string, active: boolean): Promise<boolean> {
  const updated = await prisma.promoCode.updateMany({ where: { id }, data: { active } });
  return updated.count === 1;
}
