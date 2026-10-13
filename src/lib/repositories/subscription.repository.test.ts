import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  subscription: { findUnique: vi.fn() },
  natalChartReading: { findFirst: vi.fn() },
  user: { findUnique: vi.fn() },
}));

vi.mock("@/lib/db", () => ({ prisma: db }));

import { getPlanTier, getPremiumState, hasFullAccess } from "./subscription.repository";

const DAY = 24 * 60 * 60 * 1000;
const now = new Date("2026-10-13T12:00:00Z");

const activeSubscription = { tier: "PREMIUM", status: "ACTIVE", currentPeriodEnd: new Date(now.getTime() + 10 * DAY) };

beforeEach(() => {
  db.subscription.findUnique.mockReset().mockResolvedValue(null);
  db.natalChartReading.findFirst.mockReset().mockResolvedValue(null);
  db.user.findUnique.mockReset().mockResolvedValue({ id: "u1", telegramId: null });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("hasFullAccess", () => {
  it("is false for everyone, without even touching the database, while no admins are configured", async () => {
    expect(await hasFullAccess("u1")).toBe(false);
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });

  it("is true only for an account listed as an admin", async () => {
    vi.stubEnv("ADMIN_USER_IDS", "u1");
    expect(await hasFullAccess("u1")).toBe(true);
    db.user.findUnique.mockResolvedValue({ id: "u2", telegramId: null });
    expect(await hasFullAccess("u2")).toBe(false);
    db.user.findUnique.mockResolvedValue(null);
    expect(await hasFullAccess("gone")).toBe(false);
  });

  it("recognizes an admin by Telegram id", async () => {
    vi.stubEnv("ADMIN_TELEGRAM_IDS", "777");
    db.user.findUnique.mockResolvedValue({ id: "u3", telegramId: "777" });
    expect(await hasFullAccess("u3")).toBe(true);
  });
});

describe("getPremiumState", () => {
  it("gives an admin full access: premium tier, a free natal chart at any moment, no period", async () => {
    vi.stubEnv("ADMIN_USER_IDS", "u1");
    const state = await getPremiumState("u1", now);
    expect(state).toEqual({ planTier: "premium", currentPeriodEnd: null, natalChartWeekly: { available: true, nextAvailableAt: null }, fullAccess: true });
    expect(db.subscription.findUnique).not.toHaveBeenCalled();
  });

  it("keeps an ordinary user free when admins exist but they are not one of them", async () => {
    vi.stubEnv("ADMIN_USER_IDS", "someone-else");
    const state = await getPremiumState("u1", now);
    expect(state.planTier).toBe("free");
    expect(state.fullAccess).toBe(false);
    expect(state.natalChartWeekly.available).toBe(false);
  });

  it("still applies the paid Premium rules to a paying non-admin", async () => {
    db.subscription.findUnique.mockResolvedValue(activeSubscription);
    db.natalChartReading.findFirst.mockResolvedValue({ createdAt: new Date(now.getTime() - 2 * DAY) });
    const state = await getPremiumState("u1", now);
    expect(state.planTier).toBe("premium");
    expect(state.fullAccess).toBe(false);
    expect(state.natalChartWeekly.available).toBe(false);
    expect(state.natalChartWeekly.nextAvailableAt).toEqual(new Date(now.getTime() + 5 * DAY));
  });
});

describe("getPlanTier", () => {
  it("is premium for an admin even without a subscription", async () => {
    vi.stubEnv("ADMIN_USER_IDS", "u1");
    expect(await getPlanTier("u1")).toBe("premium");
  });

  it("is free for an ordinary user without a subscription, and premium with a running one", async () => {
    expect(await getPlanTier("u1")).toBe("free");
    db.subscription.findUnique.mockResolvedValue({ ...activeSubscription, currentPeriodEnd: new Date(Date.now() + DAY) });
    expect(await getPlanTier("u1")).toBe("premium");
  });
});
