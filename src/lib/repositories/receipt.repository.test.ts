import { beforeEach, describe, expect, it, vi } from "vitest";

interface PurchaseRow {
  id: string;
  userId: string;
  status: string;
  receiptUrl: string | null;
  receiptAttachedBy: string | null;
  receiptSentAt: Date | null;
}

/** Небольшая замена в памяти для покупок и журнала действий. */
const state = vi.hoisted(() => ({
  purchases: new Map<string, PurchaseRow>(),
  actions: [] as { adminId: string; targetUserId: string | null; action: string; details: Record<string, unknown> }[],
}));

vi.mock("@/lib/db", () => {
  const matches = (row: PurchaseRow, where: Record<string, unknown>) =>
    Object.entries(where).every(([key, value]) => row[key as keyof PurchaseRow] === value);
  const tx = {
    purchase: {
      // Копия, как у настоящей базы: последующее обновление не меняет уже прочитанную строку.
      findUnique: async ({ where }: { where: { id: string } }) => {
        const row = state.purchases.get(where.id);
        return row ? { ...row } : null;
      },
      updateMany: async ({ where, data }: { where: Record<string, unknown>; data: Partial<PurchaseRow> }) => {
        const row = state.purchases.get(where.id as string);
        if (!row || !matches(row, where)) return { count: 0 };
        Object.assign(row, data);
        return { count: 1 };
      },
    },
    adminAction: {
      create: async ({ data }: { data: (typeof state.actions)[number] }) => {
        state.actions.push(data);
      },
    },
  };
  return { prisma: { $transaction: async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx) } };
});

import { attachReceipt, markReceiptSent } from "./receipt.repository";

const FIRST = "https://lknpd.nalog.ru/api/v1/receipt/771234567890/first/print";
const SECOND = "https://lknpd.nalog.ru/api/v1/receipt/771234567890/second/print";

function seed(overrides: Partial<PurchaseRow> = {}) {
  state.purchases.set("p1", { id: "p1", userId: "u1", status: "paid", receiptUrl: null, receiptAttachedBy: null, receiptSentAt: null, ...overrides });
}

beforeEach(() => {
  state.purchases.clear();
  state.actions.length = 0;
});

describe("attachReceipt", () => {
  it("сохраняет ссылку, кто её внёс, и пишет в журнал", async () => {
    seed();
    expect(await attachReceipt({ purchaseId: "p1", adminId: "admin-1", receiptUrl: FIRST })).toEqual({ ok: true, changed: true });
    expect(state.purchases.get("p1")).toMatchObject({ receiptUrl: FIRST, receiptAttachedBy: "admin-1", receiptSentAt: null });
    expect(state.actions).toEqual([
      { adminId: "admin-1", targetUserId: "u1", action: "receipt.attach", details: { purchaseId: "p1", receiptUrl: FIRST, previousUrl: null } },
    ]);
  });

  it("та же ссылка повторно ничего не меняет и не пишется в журнал", async () => {
    const sentAt = new Date("2026-10-18T12:00:00Z");
    seed({ receiptUrl: FIRST, receiptAttachedBy: "admin-1", receiptSentAt: sentAt });
    expect(await attachReceipt({ purchaseId: "p1", adminId: "admin-2", receiptUrl: FIRST })).toEqual({ ok: true, changed: false });
    expect(state.purchases.get("p1")).toMatchObject({ receiptAttachedBy: "admin-1", receiptSentAt: sentAt });
    expect(state.actions).toHaveLength(0);
  });

  it("новая ссылка снимает отметку об отправке: чек нужно отправить заново", async () => {
    seed({ receiptUrl: FIRST, receiptAttachedBy: "admin-1", receiptSentAt: new Date("2026-10-18T12:00:00Z") });
    expect(await attachReceipt({ purchaseId: "p1", adminId: "admin-2", receiptUrl: SECOND })).toEqual({ ok: true, changed: true });
    expect(state.purchases.get("p1")).toMatchObject({ receiptUrl: SECOND, receiptAttachedBy: "admin-2", receiptSentAt: null });
    expect(state.actions[0].details).toEqual({ purchaseId: "p1", receiptUrl: SECOND, previousUrl: FIRST });
  });

  it("чек ведётся только у оплаченной покупки", async () => {
    for (const status of ["pending", "failed", "refunded"]) {
      seed({ status });
      expect(await attachReceipt({ purchaseId: "p1", adminId: "admin-1", receiptUrl: FIRST })).toEqual({ ok: false, error: "not_paid" });
    }
    expect(await attachReceipt({ purchaseId: "missing", adminId: "admin-1", receiptUrl: FIRST })).toEqual({ ok: false, error: "not_found" });
    expect(state.actions).toHaveLength(0);
  });
});

describe("markReceiptSent", () => {
  it("ставит время отправки и пишет каналы в журнал", async () => {
    seed({ receiptUrl: FIRST });
    expect(await markReceiptSent({ purchaseId: "p1", adminId: "admin-1", receiptUrl: FIRST, channels: ["telegram"] })).toBe(true);
    expect(state.purchases.get("p1")?.receiptSentAt).toBeInstanceOf(Date);
    expect(state.actions).toEqual([
      { adminId: "admin-1", targetUserId: "u1", action: "receipt.send", details: { purchaseId: "p1", receiptUrl: FIRST, channels: ["telegram"] } },
    ]);
  });

  it("не отмечает, если ссылку успели заменить или покупку вернули", async () => {
    seed({ receiptUrl: SECOND });
    expect(await markReceiptSent({ purchaseId: "p1", adminId: "admin-1", receiptUrl: FIRST, channels: ["email"] })).toBe(false);
    seed({ receiptUrl: FIRST, status: "refunded" });
    expect(await markReceiptSent({ purchaseId: "p1", adminId: "admin-1", receiptUrl: FIRST, channels: ["email"] })).toBe(false);
    expect(state.purchases.get("p1")?.receiptSentAt).toBeNull();
    expect(state.actions).toHaveLength(0);
  });
});
