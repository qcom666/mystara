import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Подписка Premium Звёздами с автопродлением целиком: первая оплата, повторное списание, отмена и возврат.
 * Таблицы заменены небольшой базой в памяти, Bot API — записывающей заглушкой.
 */

type Row = Record<string, unknown>;

const db = vi.hoisted(() => ({
  purchases: new Map<string, Row>(),
  starSubscriptions: new Map<string, Row>(),
  subscriptions: new Map<string, Row>(),
  users: new Map<string, Row>(),
  adminActions: [] as Row[],
  sequence: 0,
}));

vi.mock("./referral.repository", () => ({ rewardReferrerOnFirstPayment: async () => false, revokeReferralRewardForRefund: async () => 0 }));

vi.mock("@/lib/db", () => {
  const matches = (row: Row, where: Row = {}): boolean =>
    Object.entries(where).every(([key, condition]) => {
      if (key === "OR") return (condition as Row[]).some((branch) => matches(row, branch));
      const value = row[key];
      if (condition !== null && typeof condition === "object" && !(condition instanceof Date)) {
        const rule = condition as { in?: unknown[]; not?: unknown; gt?: Date };
        if (rule.in) return rule.in.includes(value);
        if ("not" in rule) return value !== rule.not;
        if (rule.gt) return value instanceof Date && value > rule.gt;
        return false;
      }
      return value === condition;
    });
  const withRelations = (row: Row | undefined, args: { include?: Row; select?: Row }) => {
    if (!row) return null;
    const relations = { ...(args.include ?? {}), ...(args.select ?? {}) };
    const result: Row = { ...row };
    if (relations.user) result.user = { ...db.users.get(row.userId as string), subscription: db.subscriptions.get(row.userId as string) ?? null };
    if (relations.starSubscription) result.starSubscription = db.starSubscriptions.get(row.id as string) ?? null;
    if (relations.purchase) result.purchase = db.purchases.get(row.purchaseId as string) ?? null;
    return result;
  };

  const client = {
    purchase: {
      findUnique: async (args: { where: { id: string }; include?: Row; select?: Row }) => withRelations(db.purchases.get(args.where.id), args),
      findFirst: async ({ where }: { where: Row }) => [...db.purchases.values()].find((row) => matches(row, where)) ?? null,
      findMany: async ({ where }: { where: Row }) => [...db.purchases.values()].filter((row) => matches(row, where)),
      updateMany: async ({ where, data }: { where: Row; data: Row }) => {
        const rows = [...db.purchases.values()].filter((row) => matches(row, where));
        rows.forEach((row) => Object.assign(row, data));
        return { count: rows.length };
      },
      create: async ({ data }: { data: Row }) => {
        const row = { id: `r${++db.sequence}`, autoRenew: false, renewalOfId: null, createdAt: new Date(), ...data };
        db.purchases.set(row.id, row);
        return row;
      },
    },
    starSubscription: {
      findUnique: async ({ where }: { where: { purchaseId: string } }) => db.starSubscriptions.get(where.purchaseId) ?? null,
      findMany: async ({ where, select }: { where: Row; select?: Row }) =>
        [...db.starSubscriptions.values()].filter((row) => matches(row, where)).map((row) => withRelations(row, { select })),
      count: async ({ where }: { where: Row }) => [...db.starSubscriptions.values()].filter((row) => matches(row, where)).length,
      create: async ({ data }: { data: Row }) => {
        const row = { state: "active", canceledBy: null, createdAt: new Date(), updatedAt: new Date(), ...data };
        db.starSubscriptions.set(data.purchaseId as string, row);
        return row;
      },
      update: async ({ where, data, select }: { where: { purchaseId: string }; data: Row; select?: Row }) => {
        const row = db.starSubscriptions.get(where.purchaseId)!;
        Object.assign(row, data, { updatedAt: new Date() });
        return withRelations(row, { select });
      },
    },
    subscription: {
      findUnique: async ({ where }: { where: { userId: string } }) => db.subscriptions.get(where.userId) ?? null,
      upsert: async ({ where, create, update }: { where: { userId: string }; create: Row; update: Row }) => {
        const existing = db.subscriptions.get(where.userId);
        db.subscriptions.set(where.userId, existing ? { ...existing, ...update } : create);
      },
      update: async ({ where, data }: { where: { userId: string }; data: Row }) => Object.assign(db.subscriptions.get(where.userId)!, data),
    },
    user: {
      findUnique: async ({ where }: { where: { id: string } }) => db.users.get(where.id) ?? null,
      update: async ({ where, data }: { where: { id: string }; data: Row }) => Object.assign(db.users.get(where.id)!, data),
    },
    adminAction: { create: async ({ data }: { data: Row }) => db.adminActions.push(data) },
    $queryRaw: async () => [],
  };
  return { prisma: { ...client, $transaction: async (fn: (tx: typeof client) => unknown) => fn(client) } };
});

import { refundPurchaseByAdmin } from "@/lib/payments/refund";
import { cancelStarSubscription, cancelUserStarSubscriptions } from "@/lib/payments/star-subscriptions";
import { fulfillPayment, isPurchasePayable, type PaidPayment } from "./purchase.repository";
import { getAutoRenewView, setStarSubscriptionState } from "./star-subscription.repository";

const DAY = 24 * 60 * 60 * 1000;
const T0 = new Date("2026-11-01T10:00:00Z");
const at = (days: number) => new Date(T0.getTime() + days * DAY);
const env = { TELEGRAM_BOT_TOKEN: "123:TEST" };

/** Списание по подписке, как его присылает вебхук: свой charge id, тот же payload, срок у Telegram. */
const charge = (chargeId: string, chargedAt: Date, expiresAt: Date | null): PaidPayment => ({
  purchaseId: "sub1",
  provider: "stars",
  externalId: chargeId,
  amount: 150,
  currency: "XTR",
  subscription: { chargedAt, expiresAt, telegramUserId: "42" },
});

/** Bot API: отвечает «ok» и запоминает, какие методы и с чем вызваны. */
function botApi(status = 200) {
  const calls: { method: string; body: Row }[] = [];
  const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ method: String(url).split("/").pop()!, body: JSON.parse(String(init?.body)) });
    return new Response(JSON.stringify(status === 200 ? { ok: true, result: true } : { ok: false }), { status });
  });
  return { calls, fetchImpl: fetchImpl as unknown as typeof fetch };
}

const premiumEnd = () => (db.subscriptions.get("u1")?.currentPeriodEnd as Date | undefined)?.getTime();
const subscription = () => db.starSubscriptions.get("sub1")!;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(T0);
  db.purchases.clear();
  db.starSubscriptions.clear();
  db.subscriptions.clear();
  db.users.clear();
  db.adminActions.length = 0;
  db.users.set("u1", { id: "u1", telegramId: "42", language: "ru", natalChartCredits: 0 });
  db.purchases.set("sub1", {
    id: "sub1",
    userId: "u1",
    product: "premium_month",
    provider: "stars",
    amount: 150,
    currency: "XTR",
    status: "pending",
    creditsGranted: 0,
    externalId: null,
    autoRenew: true,
    renewalOfId: null,
    createdAt: T0,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("первая оплата подписки", () => {
  it("исходная покупка оплачена, Premium ровно до срока подписки, подписка запомнена с первым charge id", async () => {
    expect(await fulfillPayment(charge("charge-1", T0, at(30)))).toEqual({ result: "fulfilled", purchaseId: "sub1" });
    expect(db.purchases.get("sub1")).toMatchObject({ status: "paid", externalId: "charge-1" });
    expect(db.subscriptions.get("u1")).toMatchObject({ tier: "PREMIUM", status: "ACTIVE", provider: "stars" });
    expect(premiumEnd()).toBe(at(30).getTime());
    expect(subscription()).toMatchObject({ chargeId: "charge-1", telegramUserId: "42", state: "active", expiresAt: at(30) });
    expect(await getAutoRenewView("u1")).toEqual({ state: "active", expiresAt: at(30), amount: 150, cancelable: true });
  });

  it("оставшиеся дни разовой оплаты сохраняются", async () => {
    db.subscriptions.set("u1", { userId: "u1", tier: "PREMIUM", status: "ACTIVE", provider: "yookassa", externalId: "pay", currentPeriodEnd: at(10) });
    await fulfillPayment(charge("charge-1", T0, at(30)));
    expect(premiumEnd()).toBe(at(40).getTime());
  });

  it("повторная доставка той же оплаты ничего не добавляет", async () => {
    await fulfillPayment(charge("charge-1", T0, at(30)));
    expect(await fulfillPayment(charge("charge-1", T0, at(30)))).toEqual({ result: "already_paid", purchaseId: "sub1" });
    expect(premiumEnd()).toBe(at(30).getTime());
    expect(db.purchases.size).toBe(1);
  });

  it("счёт подписки остаётся оплачиваемым для подтверждения продлений, сумма сверяется", async () => {
    const order = { purchaseId: "sub1", provider: "stars" as const, amount: 150, currency: "XTR" as const };
    expect(await isPurchasePayable(order)).toBe(true);
    await fulfillPayment(charge("charge-1", T0, at(30)));
    expect(await isPurchasePayable(order)).toBe(true);
    expect(await isPurchasePayable({ ...order, amount: 1 })).toBe(false);
  });
});

describe("повторное списание", () => {
  beforeEach(async () => {
    await fulfillPayment(charge("charge-1", T0, at(30)));
    vi.setSystemTime(at(30));
  });

  it("создаёт свою покупку со ссылкой на исходную и продлевает Premium до нового срока Telegram", async () => {
    const outcome = await fulfillPayment(charge("charge-2", at(30), at(60)));
    expect(outcome.result).toBe("fulfilled");
    expect(outcome.purchaseId).not.toBe("sub1");
    expect(db.purchases.get(outcome.purchaseId)).toMatchObject({ status: "paid", externalId: "charge-2", renewalOfId: "sub1", amount: 150, autoRenew: false });
    expect(db.purchases.get("sub1")).toMatchObject({ status: "paid", externalId: "charge-1" });
    expect(premiumEnd()).toBe(at(60).getTime());
    expect(subscription()).toMatchObject({ chargeId: "charge-1", expiresAt: at(60), state: "active" });
  });

  it("одно списание из вебхука и из сверки выдаётся один раз", async () => {
    const first = await fulfillPayment(charge("charge-2", at(30), at(60)));
    const again = await fulfillPayment(charge("charge-2", at(30), null));
    expect(again).toEqual({ result: "already_paid", purchaseId: first.purchaseId });
    expect(premiumEnd()).toBe(at(60).getTime());
    expect([...db.purchases.values()].filter((row) => row.renewalOfId === "sub1")).toHaveLength(1);
  });

  it("списание, найденное сверкой без срока, продлевает на период от прежнего срока", async () => {
    await fulfillPayment(charge("charge-2", at(30), null));
    expect(subscription().expiresAt).toEqual(at(60));
    expect(premiumEnd()).toBe(at(60).getTime());
  });

  it("чужая сумма не выдаётся", async () => {
    expect((await fulfillPayment({ ...charge("charge-2", at(30), at(60)), amount: 100 })).result).toBe("mismatch");
    expect(premiumEnd()).toBe(at(30).getTime());
  });
});

describe("отмена", () => {
  beforeEach(async () => {
    await fulfillPayment(charge("charge-1", T0, at(30)));
    vi.setSystemTime(at(5));
  });

  it("кнопка в кабинете: бот отключает продление по первому charge id, оплаченный срок остаётся", async () => {
    const api = botApi();
    expect(await cancelUserStarSubscriptions("u1", env, api.fetchImpl)).toEqual({ result: "ok", canceled: 1 });
    expect(api.calls).toEqual([{ method: "editUserStarSubscription", body: { user_id: 42, telegram_payment_charge_id: "charge-1", is_canceled: true } }]);
    expect(subscription()).toMatchObject({ state: "canceled", canceledBy: "bot" });
    expect(premiumEnd()).toBe(at(30).getTime());
    expect(await getAutoRenewView("u1")).toMatchObject({ state: "canceled", cancelable: false });
  });

  it("отказ Telegram и сбой различаются, состояние при этом не меняется", async () => {
    const target = { purchaseId: "sub1", chargeId: "charge-1", telegramUserId: "42" };
    expect(await cancelStarSubscription(target, env, botApi(400).fetchImpl)).toBe("rejected");
    expect(await cancelStarSubscription(target, env, botApi(502).fetchImpl)).toBe("unavailable");
    expect(subscription().state).toBe("active");
  });

  it("отмена в Telegram (обновление subscription) запоминается; чужой пользователь Telegram не может её изменить", async () => {
    expect(await setStarSubscriptionState("sub1", "canceled", { canceledBy: "user", telegramUserId: "999" })).toBeNull();
    expect(subscription().state).toBe("active");
    const updated = await setStarSubscriptionState("sub1", "canceled", { canceledBy: "user", telegramUserId: "42" });
    expect(updated).toMatchObject({ state: "canceled", expiresAt: at(30), user: { telegramId: "42" } });
    expect(subscription()).toMatchObject({ state: "canceled", canceledBy: "user" });
  });

  it("списание до отмены, найденное сверкой позже, отмену не снимает; новое списание (продление возобновили) снимает", async () => {
    await setStarSubscriptionState("sub1", "canceled", { canceledBy: "user", telegramUserId: "42" });
    await fulfillPayment(charge("charge-old", at(4), null));
    expect(subscription().state).toBe("canceled");
    vi.setSystemTime(at(30));
    await fulfillPayment(charge("charge-2", at(30), at(60)));
    expect(subscription()).toMatchObject({ state: "active", canceledBy: null });
  });
});

describe("возврат", () => {
  it("возврат последнего списания снимает его месяц и отключает продление", async () => {
    // До подписки оставалось 10 оплаченных дней: после первой оплаты Premium до 40-го дня, после продления — до 70-го.
    db.subscriptions.set("u1", { userId: "u1", tier: "PREMIUM", status: "ACTIVE", provider: "yookassa", externalId: "pay", currentPeriodEnd: at(10) });
    await fulfillPayment(charge("charge-1", T0, at(30)));
    vi.setSystemTime(at(30));
    const renewal = await fulfillPayment(charge("charge-2", at(30), at(60)));
    expect(premiumEnd()).toBe(at(70).getTime());
    vi.setSystemTime(at(31));

    const api = botApi();
    expect(await refundPurchaseByAdmin({ purchaseId: renewal.purchaseId, adminId: "admin", reason: "по просьбе покупателя" }, env, api.fetchImpl)).toEqual({
      ok: true,
      status: "refunded",
    });
    expect(api.calls.map((call) => call.method)).toEqual(["refundStarPayment", "editUserStarSubscription"]);
    expect(api.calls[0].body).toEqual({ user_id: 42, telegram_payment_charge_id: "charge-2" });
    expect(api.calls[1].body).toMatchObject({ telegram_payment_charge_id: "charge-1", is_canceled: true });
    expect(db.purchases.get(renewal.purchaseId)?.status).toBe("refunded");
    expect(db.purchases.get("sub1")?.status).toBe("paid");
    expect(premiumEnd()).toBe(at(40).getTime());
    expect(db.subscriptions.get("u1")?.status).toBe("ACTIVE");
    expect(subscription()).toMatchObject({ state: "canceled", canceledBy: "bot" });
    expect(db.adminActions).toHaveLength(1);
  });

  it("возврат единственного списания прекращает Premium", async () => {
    await fulfillPayment(charge("charge-1", T0, at(30)));
    vi.setSystemTime(at(1));
    expect((await refundPurchaseByAdmin({ purchaseId: "sub1", adminId: "admin", reason: "ошибка" }, env, botApi().fetchImpl)).ok).toBe(true);
    expect(db.subscriptions.get("u1")).toMatchObject({ status: "CANCELED" });
    expect(premiumEnd()).toBe(at(1).getTime());
  });
});
