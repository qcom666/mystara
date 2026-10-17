import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateReferralCode, parseReferralCode, REFERRAL_REWARD_CREDITS } from "@/lib/referral";

type Tx = Prisma.TransactionClient;

/** Код приглашения пользователя; создаётся при первом обращении. */
export async function getOrCreateReferralCode(userId: string): Promise<string | null> {
  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true, deletedAt: true } });
  if (!existing || existing.deletedAt) return null;
  if (existing.referralCode) return existing.referralCode;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferralCode();
    try {
      const updated = await prisma.user.updateMany({ where: { id: userId, referralCode: null }, data: { referralCode: code } });
      if (updated.count === 1) return code;
      // Код уже успел появиться в параллельном запросе.
      return (await prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } }))?.referralCode ?? null;
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
    }
  }
  return null;
}

/**
 * Привязывает пригласившего к только что созданному аккаунту. Вызывается только при создании: у
 * существующего аккаунта пригласившего не меняем, себя пригласить нельзя, неизвестный код игнорируется.
 */
export async function attachReferrer(newUserId: string, rawCode: string | null | undefined): Promise<boolean> {
  const code = parseReferralCode(rawCode);
  if (!code) return false;
  const referrer = await prisma.user.findUnique({ where: { referralCode: code }, select: { id: true, deletedAt: true } });
  if (!referrer || referrer.deletedAt || referrer.id === newUserId) return false;
  const updated = await prisma.user.updateMany({ where: { id: newUserId, referredById: null }, data: { referredById: referrer.id } });
  return updated.count === 1;
}

/**
 * Бонус пригласившему за первую оплату приглашённого. Выполняется внутри транзакции оплаты: отметка
 * `referralRewardedAt` ставится условно, поэтому два одновременных платежа не дадут двойной бонус. Покупка
 * запоминается: если её вернут, бонус заберётся (revokeReferralRewardForRefund).
 */
export async function rewardReferrerOnFirstPayment(tx: Tx, buyerId: string, purchaseId: string): Promise<boolean> {
  const buyer = await tx.user.findUnique({ where: { id: buyerId }, select: { referredById: true, referralRewardedAt: true } });
  if (!buyer?.referredById || buyer.referralRewardedAt) return false;
  const marked = await tx.user.updateMany({
    where: { id: buyerId, referralRewardedAt: null },
    data: { referralRewardedAt: new Date(), referralRewardPurchaseId: purchaseId },
  });
  if (marked.count !== 1) return false;
  const credited = await tx.user.updateMany({
    where: { id: buyer.referredById, deletedAt: null },
    data: { natalChartCredits: { increment: REFERRAL_REWARD_CREDITS } },
  });
  return credited.count === 1;
}

/**
 * Возврат покупки, за которую пригласивший получил бонус: бонус забирается (не больше текущего остатка,
 * баланс не уходит в минус). Повторно бонус за этого приглашённого не выдаётся. Возвращает, сколько забрано.
 */
export async function revokeReferralRewardForRefund(tx: Tx, buyerId: string, purchaseId: string): Promise<number> {
  const buyer = await tx.user.findUnique({ where: { id: buyerId }, select: { referredById: true, referralRewardPurchaseId: true } });
  if (!buyer?.referredById || buyer.referralRewardPurchaseId !== purchaseId) return 0;
  const cleared = await tx.user.updateMany({ where: { id: buyerId, referralRewardPurchaseId: purchaseId }, data: { referralRewardPurchaseId: null } });
  if (cleared.count !== 1) return 0;
  const referrer = await tx.user.findUnique({ where: { id: buyer.referredById }, select: { natalChartCredits: true } });
  const revoked = Math.min(referrer?.natalChartCredits ?? 0, REFERRAL_REWARD_CREDITS);
  if (revoked > 0) await tx.user.update({ where: { id: buyer.referredById }, data: { natalChartCredits: { decrement: revoked } } });
  return revoked;
}

export async function getReferralStats(userId: string): Promise<{ invited: number; rewarded: number }> {
  const [invited, rewarded] = await Promise.all([
    prisma.user.count({ where: { referredById: userId } }),
    prisma.user.count({ where: { referredById: userId, referralRewardedAt: { not: null } } }),
  ]);
  return { invited, rewarded };
}
