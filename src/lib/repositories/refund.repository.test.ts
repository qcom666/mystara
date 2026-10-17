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

/** Небольшая замена в памяти для таблиц, которых касается возврат. */
const state = vi.hoisted(() => ({
  purchases: new Map<string, PurchaseRow>(),
  credits: new Map<string, number>(),
  subscriptions: new Map<string, { status: string; currentPeriodEnd: Date | null }>(),
  actions: [] as { adminId: string; action: string; details: Record<string, unknown> }[],
}));

// Бонус за приглашение проверяется отдельно (referral.repository.test.ts).
vi.mock("./referral.repository", () => ({ revokeReferralRewardForRefund: async () => 0, rewardReferrerOnFirstPayment: async () => false }));

vi.mock("@/lib/db", () => {
  const tx = {
    $queryRaw: async () => [],
    purchase: {
      findUnique: async ({ where }: { where: { id: string } }) => state.purchases.get(where.id) ?? null,
      updateMany: async ({ where, data }: { where: { id: string; status: string }; data: { status: string } }) => {
        const row = state.purchases.get(where.id);
        if (!row || row.status !== where.status) return { count: 0 };
        Object.assign(row, data);
        return { count: 1 };
      },
    },
    subscription: {
      findUnique: async ({ where }: { where: { userId: string } }) => state.subscriptions.get(where.userId) ?? null,
      update: async ({ where, data }: { where: { userId: string }; data: { status?: string; currentPeriodEnd?: Date } }) => {
        const row = state.subscriptions.get(where.userId);
        if (row) Object.assign(row, data);
      },
    },
    user: {
      findUnique: async ({ where }: { where: { id: string } }) => ({ natalChartCredits: state.credits.get(where.id) ?? 0 }),
      update: async ({ where, data }: { where: { id: string }; data: { natalChartCredits: { decrement: number } } }) => {
        state.credits.set(where.id, (state.credits.get(where.id) ?? 0) - data.natalChartCredits.decrement);
      },
    },
    adminAction: {
      create: async ({ data }: { data: { adminId: string; action: string; details: Record<string, unknown> } }) => {
        state.actions.push(data);
      },
    },
  };
  return { prisma: { $transaction: async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx) } };
});

import { markPurchaseRefunded } from "./purchase.repository";

const DAY = 86_400_000;
const audit = { actor: "admin-1", reason: "тест" };

function seed(overrides: Partial<PurchaseRow> = {}) {
  state.purchases.set("p1", {
    id: "p1",
    userId: "u1",
    product: "natal_pack",
    provider: "yookassa",
    amount: 1000,
    currency: "RUB",
    status: "paid",
    creditsGranted: 3,
    externalId: "pay-1",
    ...overrides,
  });
}

beforeEach(() => {
  state.purchases.clear();
  state.credits.clear();
  state.subscriptions.clear();
  state.actions.length = 0;
});

describe("markPurchaseRefunded", () => {
  it("возвращает покупку и забирает кредиты пакета", async () => {
    seed();
    state.credits.set("u1", 3);
    await expect(markPurchaseRefunded("p1", audit)).resolves.toBe("refunded");
    expect(state.purchases.get("p1")?.status).toBe("refunded");
    expect(state.credits.get("u1")).toBe(0);
    expect(state.actions[0]).toMatchObject({ adminId: "admin-1", action: "purchase.refund", details: { creditsRevoked: 3 } });
  });

  it("не уводит баланс в минус, если часть кредитов уже потрачена", async () => {
    seed();
    state.credits.set("u1", 1);
    await markPurchaseRefunded("p1", audit);
    expect(state.credits.get("u1")).toBe(0);
    expect(state.actions[0].details).toMatchObject({ creditsGranted: 3, creditsRevoked: 1 });
  });

  it("сдвигает конец Premium на длину оплаченного периода назад", async () => {
    seed({ product: "premium_month", creditsGranted: 0 });
    const end = new Date(Date.now() + 40 * DAY);
    state.subscriptions.set("u1", { status: "ACTIVE", currentPeriodEnd: end });
    await markPurchaseRefunded("p1", audit);
    const after = state.subscriptions.get("u1");
    expect(after?.status).toBe("ACTIVE");
    expect(after?.currentPeriodEnd?.getTime()).toBe(end.getTime() - 30 * DAY);
  });

  it("прекращает Premium, если после сдвига срока не остаётся", async () => {
    seed({ product: "premium_month", creditsGranted: 0 });
    state.subscriptions.set("u1", { status: "ACTIVE", currentPeriodEnd: new Date(Date.now() + 10 * DAY) });
    await markPurchaseRefunded("p1", audit);
    const after = state.subscriptions.get("u1");
    expect(after?.status).toBe("CANCELED");
    expect(after!.currentPeriodEnd!.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("повторный возврат безопасен и ничего не забирает второй раз", async () => {
    seed();
    state.credits.set("u1", 6);
    await markPurchaseRefunded("p1", audit);
    await expect(markPurchaseRefunded("p1", audit)).resolves.toBe("already_refunded");
    expect(state.credits.get("u1")).toBe(3);
    expect(state.actions).toHaveLength(1);
  });

  it("не возвращает неоплаченную и несуществующую покупки", async () => {
    seed({ status: "pending" });
    await expect(markPurchaseRefunded("p1", audit)).resolves.toBe("not_paid");
    await expect(markPurchaseRefunded("nope", audit)).resolves.toBe("not_found");
    expect(state.actions).toHaveLength(0);
  });
});
