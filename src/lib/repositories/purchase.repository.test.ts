import { beforeEach, describe, expect, it, vi } from "vitest";

/** Небольшая замена в памяти для двух таблиц, которых касается fulfillPurchase. */
const state = vi.hoisted(() => ({
  purchases: new Map<string, { id: string; userId: string; provider: string; amount: number; currency: string; status: string; creditsGranted: number; externalId: string | null }>(),
  credits: new Map<string, number>(),
}));

vi.mock("@/lib/db", () => {
  const tx = {
    natalChartPurchase: {
      findUnique: async ({ where }: { where: { id: string } }) => state.purchases.get(where.id) ?? null,
      updateMany: async ({ where, data }: { where: { id: string; status: string }; data: { status: string; externalId: string } }) => {
        const purchase = state.purchases.get(where.id);
        if (!purchase || purchase.status !== where.status) return { count: 0 };
        Object.assign(purchase, data);
        return { count: 1 };
      },
    },
    user: {
      update: async ({ where, data }: { where: { id: string }; data: { natalChartCredits: { increment: number } } }) => {
        state.credits.set(where.id, (state.credits.get(where.id) ?? 0) + data.natalChartCredits.increment);
      },
    },
  };
  return { prisma: { $transaction: async (fn: (t: typeof tx) => unknown) => fn(tx), natalChartPurchase: tx.natalChartPurchase } };
});

import { fulfillPurchase, isPurchasePayable } from "./purchase.repository";

const paid = { purchaseId: "p1", provider: "stars" as const, externalId: "charge-1", amount: 500, currency: "XTR" as const };

beforeEach(() => {
  state.purchases.clear();
  state.credits.clear();
  state.purchases.set("p1", { id: "p1", userId: "u1", provider: "stars", amount: 500, currency: "XTR", status: "pending", creditsGranted: 3, externalId: null });
});

describe("fulfillPurchase", () => {
  it("grants the pack once and marks the purchase paid", async () => {
    expect(await fulfillPurchase(paid)).toBe("fulfilled");
    expect(state.credits.get("u1")).toBe(3);
    expect(state.purchases.get("p1")).toMatchObject({ status: "paid", externalId: "charge-1" });
  });

  it("never grants twice when the provider redelivers the same payment", async () => {
    await fulfillPurchase(paid);
    expect(await fulfillPurchase(paid)).toBe("already_paid");
    expect(state.credits.get("u1")).toBe(3);
  });

  it("refuses a payment that doesn't match what was ordered", async () => {
    expect(await fulfillPurchase({ ...paid, amount: 1 })).toBe("mismatch");
    expect(await fulfillPurchase({ ...paid, provider: "yookassa" })).toBe("mismatch");
    expect(await fulfillPurchase({ ...paid, currency: "RUB" })).toBe("mismatch");
    expect(state.credits.get("u1")).toBeUndefined();
    expect(state.purchases.get("p1")?.status).toBe("pending");
  });

  it("reports an unknown purchase without granting anything", async () => {
    expect(await fulfillPurchase({ ...paid, purchaseId: "nope" })).toBe("not_found");
    expect(state.credits.size).toBe(0);
  });
});

describe("isPurchasePayable", () => {
  const order = { purchaseId: "p1", provider: "stars" as const, amount: 500, currency: "XTR" as const };

  it("accepts a pending purchase at exactly the ordered price", async () => {
    expect(await isPurchasePayable(order)).toBe(true);
  });

  it("rejects wrong prices, unknown or already-paid purchases", async () => {
    expect(await isPurchasePayable({ ...order, amount: 400 })).toBe(false);
    expect(await isPurchasePayable({ ...order, purchaseId: "nope" })).toBe(false);
    await fulfillPurchase(paid);
    expect(await isPurchasePayable(order)).toBe(false);
  });
});
