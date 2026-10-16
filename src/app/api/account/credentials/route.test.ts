import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), addPasswordLogin: vi.fn() }));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({ isDatabaseConfigured: () => true }));
vi.mock("bcryptjs", () => ({ default: { hash: async () => "hashed-password" } }));
vi.mock("@/lib/repositories/account-link.repository", () => ({ addPasswordLogin: mocks.addPasswordLogin }));

import { POST } from "./route";

let counter = 0;
const call = (body: unknown) =>
  POST(new Request("https://site.test/api/account/credentials", { method: "POST", headers: { "x-forwarded-for": `203.0.113.${++counter}` }, body: JSON.stringify(body) }));

beforeEach(() => {
  mocks.auth.mockReset();
  mocks.addPasswordLogin.mockReset();
});

describe("POST /api/account/credentials", () => {
  it("требует вход в аккаунт", async () => {
    mocks.auth.mockResolvedValue(null);
    expect((await call({ email: "a@example.com", password: "12345678" })).status).toBe(401);
    expect(mocks.addPasswordLogin).not.toHaveBeenCalled();
  });

  it("проверяет почту и длину пароля", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u1" } });
    expect((await call({ email: "не-почта", password: "12345678" })).status).toBe(400);
    expect((await call({ email: "a@example.com", password: "short" })).status).toBe(400);
    expect(mocks.addPasswordLogin).not.toHaveBeenCalled();
  });

  it("сохраняет хеш, а не пароль, и привязывает к аккаунту из сессии", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u1" } });
    mocks.addPasswordLogin.mockResolvedValue("ok");
    expect((await call({ email: "a@example.com", password: "12345678" })).status).toBe(200);
    expect(mocks.addPasswordLogin).toHaveBeenCalledWith("u1", "a@example.com", "hashed-password");
  });

  it("сообщает о занятом e-mail", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u1" } });
    mocks.addPasswordLogin.mockResolvedValue("email_taken");
    const response = await call({ email: "a@example.com", password: "12345678" });
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "email_taken" });
  });
});
