import { beforeEach, describe, expect, it, vi } from "vitest";

interface UserRow {
  id: string;
  referralCode: string | null;
  referredById: string | null;
  referralRewardedAt: Date | null;
  referralRewardPurchaseId?: string | null;
  deletedAt: Date | null;
  natalChartCredits: number;
}

const state = vi.hoisted(() => ({ users: new Map<string, UserRow>() }));

function makeClient() {
  const matches = (row: UserRow, where: Record<string, unknown>) =>
    Object.entries(where).every(([key, value]) => (row as unknown as Record<string, unknown>)[key] === value);
  return {
    user: {
      findUnique: async ({ where }: { where: { id?: string; referralCode?: string } }) =>
        [...state.users.values()].find((row) => (where.id !== undefined ? row.id === where.id : row.referralCode === where.referralCode)) ?? null,
      updateMany: async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        let count = 0;
        for (const row of state.users.values()) {
          if (!matches(row, where)) continue;
          for (const [key, value] of Object.entries(data)) {
            if (value && typeof value === "object" && "increment" in value) (row as unknown as Record<string, number>)[key] += (value as { increment: number }).increment;
            else (row as unknown as Record<string, unknown>)[key] = value;
          }
          count += 1;
        }
        return { count };
      },
      update: async ({ where, data }: { where: { id: string }; data: { natalChartCredits: { decrement: number } } }) => {
        const row = state.users.get(where.id);
        if (row) row.natalChartCredits -= data.natalChartCredits.decrement;
        return row;
      },
      count: async ({ where }: { where: { referredById: string; referralRewardedAt?: unknown } }) =>
        [...state.users.values()].filter((row) => row.referredById === where.referredById && (where.referralRewardedAt === undefined || row.referralRewardedAt !== null)).length,
    },
  };
}

vi.mock("@/lib/db", () => ({ prisma: makeClient() }));

import { attachReferrer, getOrCreateReferralCode, getReferralStats, revokeReferralRewardForRefund, rewardReferrerOnFirstPayment } from "./referral.repository";

function user(id: string, overrides: Partial<UserRow> = {}) {
  state.users.set(id, { id, referralCode: null, referredById: null, referralRewardedAt: null, deletedAt: null, natalChartCredits: 0, ...overrides });
}

beforeEach(() => state.users.clear());

describe("приглашения", () => {
  it("код создаётся один раз и потом не меняется", async () => {
    user("u1");
    const code = await getOrCreateReferralCode("u1");
    expect(code).toMatch(/^[A-Z2-9]{8}$/);
    await expect(getOrCreateReferralCode("u1")).resolves.toBe(code);
  });

  it("новый аккаунт привязывается к пригласившему, себя пригласить нельзя", async () => {
    user("inviter", { referralCode: "ABCDEFGH" });
    user("friend");
    await expect(attachReferrer("friend", "abcdefgh")).resolves.toBe(true);
    expect(state.users.get("friend")?.referredById).toBe("inviter");
    await expect(attachReferrer("inviter", "ABCDEFGH")).resolves.toBe(false);
  });

  it("неизвестный, мусорный код и уже привязанный аккаунт игнорируются", async () => {
    user("inviter", { referralCode: "ABCDEFGH" });
    user("other", { referralCode: "HJKMNPQR" });
    user("friend", { referredById: "other" });
    await expect(attachReferrer("friend", "ABCDEFGH")).resolves.toBe(false);
    await expect(attachReferrer("friend", "ZZZZZZZZ")).resolves.toBe(false);
    await expect(attachReferrer("friend", "<script>")).resolves.toBe(false);
    expect(state.users.get("friend")?.referredById).toBe("other");
  });

  it("бонус пригласившему один раз, за первую оплату приглашённого", async () => {
    user("inviter", { referralCode: "ABCDEFGH" });
    user("friend", { referredById: "inviter" });
    const tx = makeClient() as never;
    await expect(rewardReferrerOnFirstPayment(tx, "friend", "p1")).resolves.toBe(true);
    await expect(rewardReferrerOnFirstPayment(tx, "friend", "p1")).resolves.toBe(false);
    expect(state.users.get("inviter")?.natalChartCredits).toBe(1);
    await expect(getReferralStats("inviter")).resolves.toEqual({ invited: 1, rewarded: 1 });
  });

  it("без пригласившего или если тот удалён - бонуса нет", async () => {
    user("solo");
    user("ghost", { deletedAt: new Date() });
    user("friend", { referredById: "ghost" });
    const tx = makeClient() as never;
    await expect(rewardReferrerOnFirstPayment(tx, "solo", "p1")).resolves.toBe(false);
    await expect(rewardReferrerOnFirstPayment(tx, "friend", "p1")).resolves.toBe(false);
    expect(state.users.get("ghost")?.natalChartCredits).toBe(0);
  });

  it("возврат покупки, за которую выдан бонус, забирает его один раз", async () => {
    user("inviter", { referralCode: "ABCDEFGH" });
    user("friend", { referredById: "inviter" });
    const tx = makeClient() as never;
    await rewardReferrerOnFirstPayment(tx, "friend", "p1");
    expect(state.users.get("friend")?.referralRewardPurchaseId).toBe("p1");
    await expect(revokeReferralRewardForRefund(tx, "friend", "other-purchase")).resolves.toBe(0);
    await expect(revokeReferralRewardForRefund(tx, "friend", "p1")).resolves.toBe(1);
    await expect(revokeReferralRewardForRefund(tx, "friend", "p1")).resolves.toBe(0);
    expect(state.users.get("inviter")?.natalChartCredits).toBe(0);
    await expect(rewardReferrerOnFirstPayment(tx, "friend", "p2")).resolves.toBe(false);
  });
});
