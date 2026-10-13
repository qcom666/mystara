import { beforeEach, describe, expect, it, vi } from "vitest";

interface PurchaseRow {
  id: string;
  userId: string;
  product: "natal_pack" | "premium_month";
  provider: string;
  amount: number;
  currency: string;
  status: string;
  creditsGranted: number;
  externalId: string | null;
}

interface SubscriptionRow {
  userId: string;
  tier: string;
  status: string;
  provider: string | null;
  externalId: string | null;
  currentPeriodEnd: Date | null;
}

/** Небольшая замена в памяти для таблиц, которых касается fulfillPurchase. */
const state = vi.hoisted(() => ({
  purchases: new Map<string, PurchaseRow>(),
  credits: new Map<string, number>(),
  subscriptions: new Map<string, SubscriptionRow>(),
  locks: 0,
}));

vi.mock("@/lib/db", () => {
  const purchase = {
    findUnique: async ({ where }: { where: { id: string } }) => state.purchases.get(where.id) ?? null,
    updateMany: async ({ where, data }: { where: { id: string; status: string }; data: { status: string; externalId: string } }) => {
      const row = state.purchases.get(where.id);
      if (!row || row.status !== where.status) return { count: 0 };
      Object.assign(row, data);
      return { count: 1 };
    },
  };
  const tx = {
    purchase,
    user: {
      update: async ({ where, data }: { where: { id: string }; data: { natalChartCredits: { increment: number } } }) => {
        state.credits.set(where.id, (state.credits.get(where.id) ?? 0) + data.natalChartCredits.increment);
      },
    },
    subscription: {
      findUnique: async ({ where }: { where: { userId: string } }) => state.subscriptions.get(where.userId) ?? null,
      upsert: async ({ where, create, update }: { where: { userId: string }; create: SubscriptionRow; update: Partial<SubscriptionRow> }) => {
        const existing = state.subscriptions.get(where.userId);
        state.subscriptions.set(where.userId, existing ? { ...existing, ...update } : create);
      },
    },
    $queryRaw: async () => {
      state.locks += 1;
      return [];
    },
  };
  return { prisma: { $transaction: async (fn: (t: typeof tx) => unknown) => fn(tx), purchase } };
});

import { fulfillPurchase, isPurchasePayable } from "./purchase.repository";

const DAY = 24 * 60 * 60 * 1000;
const paid = { purchaseId: "p1", provider: "stars" as const, externalId: "charge-1", amount: 500, currency: "XTR" as const };
const premiumPaid = { purchaseId: "m1", provider: "yookassa" as const, externalId: "pay-1", amount: 300, currency: "RUB" as const };

beforeEach(() => {
  state.purchases.clear();
  state.credits.clear();
  state.subscriptions.clear();
  state.locks = 0;
  state.purchases.set("p1", { id: "p1", userId: "u1", product: "natal_pack", provider: "stars", amount: 500, currency: "XTR", status: "pending", creditsGranted: 3, externalId: null });
  state.purchases.set("m1", { id: "m1", userId: "u1", product: "premium_month", provider: "yookassa", amount: 300, currency: "RUB", status: "pending", creditsGranted: 0, externalId: null });
});

describe("fulfillPurchase — пакет натальных карт", () => {
  it("grants the pack once and marks the purchase paid", async () => {
    expect(await fulfillPurchase(paid)).toBe("fulfilled");
    expect(state.credits.get("u1")).toBe(3);
    expect(state.purchases.get("p1")).toMatchObject({ status: "paid", externalId: "charge-1" });
    expect(state.subscriptions.size).toBe(0);
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

describe("fulfillPurchase — Premium", () => {
  it("activates a 30-day subscription from the payment moment and gives no credits", async () => {
    const before = Date.now();
    expect(await fulfillPurchase(premiumPaid)).toBe("fulfilled");
    const subscription = state.subscriptions.get("u1");
    expect(subscription).toMatchObject({ tier: "PREMIUM", status: "ACTIVE", provider: "yookassa", externalId: "pay-1" });
    expect(subscription!.currentPeriodEnd!.getTime()).toBeGreaterThanOrEqual(before + 30 * DAY);
    expect(subscription!.currentPeriodEnd!.getTime()).toBeLessThanOrEqual(Date.now() + 30 * DAY);
    expect(state.credits.get("u1")).toBeUndefined();
    expect(state.locks).toBe(1);
  });

  it("adds the new period to the end of a running one", async () => {
    const runningEnd = new Date(Date.now() + 10 * DAY);
    state.subscriptions.set("u1", { userId: "u1", tier: "PREMIUM", status: "ACTIVE", provider: "yookassa", externalId: "old", currentPeriodEnd: runningEnd });
    await fulfillPurchase(premiumPaid);
    expect(state.subscriptions.get("u1")!.currentPeriodEnd!.getTime()).toBe(runningEnd.getTime() + 30 * DAY);
  });

  it("starts from now when the previous period has already ended, and reactivates the subscription", async () => {
    state.subscriptions.set("u1", { userId: "u1", tier: "PREMIUM", status: "CANCELED", provider: null, externalId: null, currentPeriodEnd: new Date(Date.now() - 5 * DAY) });
    await fulfillPurchase(premiumPaid);
    const subscription = state.subscriptions.get("u1")!;
    expect(subscription.status).toBe("ACTIVE");
    expect(subscription.currentPeriodEnd!.getTime()).toBeGreaterThan(Date.now() + 29 * DAY);
  });

  it("does not extend twice when the provider redelivers the same payment", async () => {
    await fulfillPurchase(premiumPaid);
    const firstEnd = state.subscriptions.get("u1")!.currentPeriodEnd!.getTime();
    expect(await fulfillPurchase(premiumPaid)).toBe("already_paid");
    expect(state.subscriptions.get("u1")!.currentPeriodEnd!.getTime()).toBe(firstEnd);
  });

  it("refuses a Premium payment of the wrong amount", async () => {
    expect(await fulfillPurchase({ ...premiumPaid, amount: 30 })).toBe("mismatch");
    expect(state.subscriptions.size).toBe(0);
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
