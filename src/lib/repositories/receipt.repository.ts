import { prisma } from "@/lib/db";

/**
 * Учёт чеков самозанятого по покупкам (см. lib/payments/receipts.ts). Чек ведётся только у оплаченной покупки.
 * Каждое изменение пишется в журнал действий администратора в той же транзакции.
 */

export type AttachReceiptResult = { ok: true; changed: boolean } | { ok: false; error: "not_found" | "not_paid" };

/**
 * Сохраняет ссылку на чек. Если ссылка поменялась после отправки, отметка об отправке снимается: покупатель
 * получил прежнюю ссылку, и чек нужно отправить заново. Та же ссылка повторно ничего не меняет.
 */
export async function attachReceipt(input: { purchaseId: string; adminId: string; receiptUrl: string }): Promise<AttachReceiptResult> {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({ where: { id: input.purchaseId }, select: { id: true, userId: true, status: true, receiptUrl: true } });
    if (!purchase) return { ok: false, error: "not_found" } as const;
    if (purchase.status !== "paid") return { ok: false, error: "not_paid" } as const;
    if (purchase.receiptUrl === input.receiptUrl) return { ok: true, changed: false } as const;

    const updated = await tx.purchase.updateMany({
      where: { id: purchase.id, status: "paid" },
      data: { receiptUrl: input.receiptUrl, receiptAttachedBy: input.adminId, receiptSentAt: null },
    });
    if (updated.count === 0) return { ok: false, error: "not_paid" } as const;

    await tx.adminAction.create({
      data: {
        adminId: input.adminId,
        targetUserId: purchase.userId,
        action: "receipt.attach",
        details: { purchaseId: purchase.id, receiptUrl: input.receiptUrl, previousUrl: purchase.receiptUrl },
      },
    });
    return { ok: true, changed: true } as const;
  });
}

/** Что нужно, чтобы отправить чек покупателю: сама покупка и его каналы связи. */
export async function getReceiptDelivery(purchaseId: string) {
  return prisma.purchase.findUnique({
    where: { id: purchaseId },
    select: {
      id: true,
      userId: true,
      status: true,
      product: true,
      amount: true,
      currency: true,
      autoRenew: true,
      renewalOfId: true,
      paidAt: true,
      createdAt: true,
      receiptUrl: true,
      user: { select: { telegramId: true, email: true, language: true } },
    },
  });
}

/**
 * Отмечает чек отправленным. Условие на ссылку: если её успели заменить, пока шла отправка, отметка не ставится
 * (покупатель получил устаревшую ссылку). Возвращает false, если покупка изменилась.
 */
export async function markReceiptSent(input: { purchaseId: string; adminId: string; receiptUrl: string; channels: string[] }): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const updated = await tx.purchase.updateMany({
      where: { id: input.purchaseId, status: "paid", receiptUrl: input.receiptUrl },
      data: { receiptSentAt: now },
    });
    if (updated.count === 0) return false;
    const purchase = await tx.purchase.findUnique({ where: { id: input.purchaseId }, select: { userId: true } });
    await tx.adminAction.create({
      data: {
        adminId: input.adminId,
        targetUserId: purchase?.userId ?? null,
        action: "receipt.send",
        details: { purchaseId: input.purchaseId, receiptUrl: input.receiptUrl, channels: input.channels },
      },
    });
    return true;
  });
}

/** Даты оплаты покупок без выданного чека: для счётчика на главной админ-панели. */
export async function listPaidWithoutReceipt(take = 5000) {
  return prisma.purchase.findMany({
    where: { status: "paid", receiptSentAt: null },
    orderBy: { createdAt: "asc" },
    take,
    select: { paidAt: true, createdAt: true },
  });
}
