import { beforeEach, describe, expect, it, vi } from "vitest";

interface TokenRow {
  identifier: string;
  token: string;
  expires: Date;
}

const state = vi.hoisted(() => ({ rows: [] as TokenRow[] }));

vi.mock("@/lib/db", () => {
  const verificationToken = {
    deleteMany: async ({ where }: { where: { identifier?: string; token?: string } }) => {
      const before = state.rows.length;
      state.rows = state.rows.filter((row) => !((where.identifier !== undefined && row.identifier === where.identifier) || (where.token !== undefined && row.token === where.token)));
      return { count: before - state.rows.length };
    },
    create: async ({ data }: { data: TokenRow }) => {
      state.rows.push(data);
      return data;
    },
    findUnique: async ({ where }: { where: { token: string } }) => state.rows.find((row) => row.token === where.token) ?? null,
  };
  const client = { verificationToken };
  return {
    prisma: {
      ...client,
      $transaction: async (arg: unknown) => (typeof arg === "function" ? (arg as (c: typeof client) => unknown)(client) : Promise.all(arg as Promise<unknown>[])),
    },
  };
});

import { hashToken } from "@/lib/auth-tokens";
import { consumeToken, issueToken } from "./auth-token.repository";

beforeEach(() => {
  state.rows = [];
});

describe("issueToken / consumeToken", () => {
  it("в базе лежит только хеш токена", async () => {
    const token = await issueToken("reset", "u1", 60_000);
    expect(state.rows).toHaveLength(1);
    expect(state.rows[0].token).toBe(hashToken(token));
    expect(state.rows[0].token).not.toBe(token);
  });

  it("токен работает один раз и возвращает то, что записано при выдаче", async () => {
    const token = await issueToken("verify", "u1:a@example.com", 60_000);
    await expect(consumeToken("verify", token)).resolves.toBe("u1:a@example.com");
    await expect(consumeToken("verify", token)).resolves.toBeNull();
  });

  it("новый запрос отменяет предыдущий токен того же назначения", async () => {
    const first = await issueToken("reset", "u1", 60_000);
    const second = await issueToken("reset", "u1", 60_000);
    await expect(consumeToken("reset", first)).resolves.toBeNull();
    await expect(consumeToken("reset", second)).resolves.toBe("u1");
  });

  it("токен чужого назначения и просроченный не принимаются", async () => {
    const reset = await issueToken("reset", "u1", 60_000);
    await expect(consumeToken("verify", reset)).resolves.toBeNull();
    const expired = await issueToken("verify", "u2:b@example.com", -1);
    await expect(consumeToken("verify", expired)).resolves.toBeNull();
    await expect(consumeToken("reset", "выдуманный-токен-который-не-существует")).resolves.toBeNull();
  });
});
