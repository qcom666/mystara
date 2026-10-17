import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ consumeToken: vi.fn(), updateMany: vi.fn() }));

vi.mock("@/lib/db", () => ({ isDatabaseConfigured: () => true, prisma: { user: { updateMany: mocks.updateMany } } }));
vi.mock("bcryptjs", () => ({ default: { hash: async () => "new-hash" } }));
vi.mock("@/lib/repositories/auth-token.repository", () => ({ consumeToken: mocks.consumeToken }));

import { POST } from "./route";

let counter = 0;
const call = (body: unknown) =>
  POST(new Request("https://site.test/api/auth/reset-password", { method: "POST", headers: { "x-forwarded-for": `198.19.0.${++counter}` }, body: JSON.stringify(body) }));

const token = "t".repeat(43);

beforeEach(() => {
  mocks.consumeToken.mockReset();
  mocks.updateMany.mockReset();
});

describe("POST /api/auth/reset-password", () => {
  it("меняет пароль по действующему токену и подтверждает почту", async () => {
    mocks.consumeToken.mockResolvedValue("u1");
    mocks.updateMany.mockResolvedValue({ count: 1 });
    expect((await call({ token, password: "new-password-1" })).status).toBe(200);
    expect(mocks.consumeToken).toHaveBeenCalledWith("reset", token);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: "u1", deletedAt: null, passwordHash: { not: null } },
      data: { passwordHash: "new-hash", emailVerified: expect.any(Date), sessionVersion: { increment: 1 } },
    });
  });

  it("неверный, просроченный или использованный токен отвергается", async () => {
    mocks.consumeToken.mockResolvedValue(null);
    const response = await call({ token, password: "new-password-1" });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_token" });
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("слишком короткий пароль не гасит токен", async () => {
    expect((await call({ token, password: "short" })).status).toBe(400);
    expect(mocks.consumeToken).not.toHaveBeenCalled();
  });

  it("токен удалённого аккаунта не срабатывает", async () => {
    mocks.consumeToken.mockResolvedValue("u1");
    mocks.updateMany.mockResolvedValue({ count: 0 });
    expect((await call({ token, password: "new-password-1" })).status).toBe(400);
  });
});
