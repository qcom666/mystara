import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

interface UserRow {
  id: string;
  email: string | null;
  passwordHash: string | null;
  telegramId: string | null;
  telegramUsername?: string | null;
  deletedAt: Date | null;
}

/** Небольшая замена в памяти: пользователи и число связанных с ними записей. */
const state = vi.hoisted(() => ({
  users: new Map<string, UserRow>(),
  related: new Map<string, number>(),
  deleted: [] as string[],
  failNextUpdateWith: null as string | null,
}));

vi.mock("@/lib/db", () => {
  const count = async ({ where }: { where: { userId: string } }) => state.related.get(where.userId) ?? 0;
  const tx = {
    user: {
      findUnique: async ({ where }: { where: { id?: string; email?: string; telegramId?: string } }) => {
        const rows = [...state.users.values()];
        return (
          rows.find((row) => (where.id !== undefined && row.id === where.id) || (where.email !== undefined && row.email === where.email) || (where.telegramId !== undefined && row.telegramId === where.telegramId)) ?? null
        );
      },
      update: async ({ where, data }: { where: { id: string }; data: Partial<UserRow> }) => {
        if (state.failNextUpdateWith) {
          const code = state.failNextUpdateWith;
          state.failNextUpdateWith = null;
          throw new Prisma.PrismaClientKnownRequestError("unique", { code, clientVersion: "test" });
        }
        Object.assign(state.users.get(where.id) as UserRow, data);
      },
      delete: async ({ where }: { where: { id: string } }) => {
        state.users.delete(where.id);
        state.deleted.push(where.id);
      },
    },
    reading: { count },
    favorite: { count: async () => 0 },
    numerologyReading: { count: async () => 0 },
    astrologyReading: { count: async () => 0 },
    natalChartReading: { count: async () => 0 },
    purchase: { count: async () => 0 },
    subscription: { count: async () => 0 },
  };
  return { prisma: { $transaction: async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx) } };
});

import { addPasswordLogin, linkTelegramToUser } from "./account-link.repository";

const telegram = { id: 555, firstName: "Анна", username: "anna" };

beforeEach(() => {
  state.users.clear();
  state.related.clear();
  state.deleted.length = 0;
  state.failNextUpdateWith = null;
});

function user(id: string, overrides: Partial<UserRow> = {}) {
  state.users.set(id, { id, email: null, passwordHash: null, telegramId: null, deletedAt: null, ...overrides });
}

describe("addPasswordLogin", () => {
  it("добавляет почту и пароль аккаунту из Telegram", async () => {
    user("u1", { telegramId: "1" });
    await expect(addPasswordLogin("u1", "anna@example.com", "hash")).resolves.toBe("ok");
    expect(state.users.get("u1")).toMatchObject({ email: "anna@example.com", passwordHash: "hash" });
  });

  it("не трогает аккаунт, у которого вход по почте уже есть", async () => {
    user("u1", { email: "old@example.com", passwordHash: "old" });
    await expect(addPasswordLogin("u1", "new@example.com", "hash")).resolves.toBe("already_has_login");
    expect(state.users.get("u1")?.email).toBe("old@example.com");
  });

  it("не отдаёт чужой e-mail, в том числе при гонке на уникальном индексе", async () => {
    user("u1", { telegramId: "1" });
    user("u2", { email: "busy@example.com", passwordHash: "x" });
    await expect(addPasswordLogin("u1", "busy@example.com", "hash")).resolves.toBe("email_taken");
    state.failNextUpdateWith = "P2002";
    await expect(addPasswordLogin("u1", "free@example.com", "hash")).resolves.toBe("email_taken");
  });

  it("не находит удалённый или отсутствующий аккаунт", async () => {
    user("u1", { deletedAt: new Date() });
    await expect(addPasswordLogin("u1", "a@example.com", "h")).resolves.toBe("not_found");
    await expect(addPasswordLogin("nope", "a@example.com", "h")).resolves.toBe("not_found");
  });
});

describe("linkTelegramToUser", () => {
  it("привязывает Telegram к аккаунту по e-mail", async () => {
    user("u1", { email: "a@example.com", passwordHash: "h" });
    await expect(linkTelegramToUser("u1", telegram)).resolves.toBe("ok");
    expect(state.users.get("u1")).toMatchObject({ telegramId: "555", telegramUsername: "anna" });
  });

  it("не привязывает второй раз", async () => {
    user("u1", { telegramId: "1" });
    await expect(linkTelegramToUser("u1", telegram)).resolves.toBe("already_linked");
  });

  it("сливает пустую оболочку: удаляет аккаунт без данных и занимает его Telegram ID", async () => {
    user("u1", { email: "a@example.com" });
    user("shell", { telegramId: "555" });
    await expect(linkTelegramToUser("u1", telegram)).resolves.toBe("ok");
    expect(state.deleted).toEqual(["shell"]);
    expect(state.users.get("u1")?.telegramId).toBe("555");
  });

  it("не трогает аккаунт Telegram, в котором есть данные", async () => {
    user("u1", { email: "a@example.com" });
    user("busy", { telegramId: "555" });
    state.related.set("busy", 3);
    await expect(linkTelegramToUser("u1", telegram)).resolves.toBe("telegram_taken");
    expect(state.deleted).toEqual([]);
    expect(state.users.get("u1")?.telegramId).toBeNull();
  });

  it("гонка на уникальном индексе тоже превращается в telegram_taken", async () => {
    user("u1", { email: "a@example.com" });
    state.failNextUpdateWith = "P2002";
    await expect(linkTelegramToUser("u1", telegram)).resolves.toBe("telegram_taken");
  });
});
