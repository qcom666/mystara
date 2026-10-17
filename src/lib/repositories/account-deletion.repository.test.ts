import { beforeEach, describe, expect, it, vi } from "vitest";

/** Журнал вызовов к таблицам внутри транзакции: проверяем, что стирается, а что сохраняется. */
const calls = vi.hoisted(() => ({ deleted: [] as string[], updated: [] as Record<string, unknown>[], user: null as { deletedAt: Date | null } | null }));

vi.mock("@/lib/db", () => {
  const deleter = (table: string) => ({
    deleteMany: async ({ where }: { where: { userId: string } }) => {
      calls.deleted.push(`${table}:${where.userId}`);
      return { count: 1 };
    },
  });
  const tx = {
    user: {
      findUnique: async () => calls.user,
      update: async ({ data }: { data: Record<string, unknown> }) => {
        calls.updated.push(data);
        return {};
      },
    },
    reading: deleter("reading"),
    favorite: deleter("favorite"),
    numerologyReading: deleter("numerologyReading"),
    astrologyReading: deleter("astrologyReading"),
    natalChartReading: deleter("natalChartReading"),
    subscription: deleter("subscription"),
    starSubscription: deleter("starSubscription"),
    account: deleter("account"),
    session: deleter("session"),
    purchase: deleter("purchase"),
  };
  return {
    prisma: {
      $transaction: async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx),
      user: { findUnique: async () => calls.user },
    },
  };
});

import { deleteAccountData, isUserGone } from "./account-deletion.repository";

describe("deleteAccountData", () => {
  beforeEach(() => {
    calls.deleted.length = 0;
    calls.updated.length = 0;
    calls.user = { deletedAt: null };
  });

  it("стирает личные данные пользователя, но не трогает платежи", async () => {
    await expect(deleteAccountData("u1")).resolves.toBe(true);
    expect(calls.deleted).toEqual([
      "reading:u1",
      "favorite:u1",
      "numerologyReading:u1",
      "astrologyReading:u1",
      "natalChartReading:u1",
      "subscription:u1",
      "starSubscription:u1",
      "account:u1",
      "session:u1",
    ]);
    expect(calls.deleted.some((entry) => entry.startsWith("purchase"))).toBe(false);
  });

  it("обезличивает строку пользователя и ставит метку удаления", async () => {
    await deleteAccountData("u1");
    const data = calls.updated[0];
    expect(data).toMatchObject({
      name: null,
      email: null,
      image: null,
      passwordHash: null,
      telegramId: null,
      telegramUsername: null,
      telegramPhotoUrl: null,
      birthDate: null,
    });
    expect(data.deletedAt).toBeInstanceOf(Date);
  });

  it("не удаляет повторно и не падает на несуществующем пользователе", async () => {
    calls.user = { deletedAt: new Date() };
    await expect(deleteAccountData("u1")).resolves.toBe(false);
    calls.user = null;
    await expect(deleteAccountData("u2")).resolves.toBe(false);
    expect(calls.deleted).toEqual([]);
    expect(calls.updated).toEqual([]);
  });
});

describe("isUserGone", () => {
  it("считает недействительной сессию удалённого или отсутствующего пользователя", async () => {
    calls.user = { deletedAt: new Date() };
    await expect(isUserGone("u1")).resolves.toBe(true);
    calls.user = null;
    await expect(isUserGone("u1")).resolves.toBe(true);
    calls.user = { deletedAt: null };
    await expect(isUserGone("u1")).resolves.toBe(false);
  });
});
