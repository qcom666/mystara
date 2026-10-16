import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ consumeToken: vi.fn(), updateMany: vi.fn() }));

vi.mock("@/lib/db", () => ({ isDatabaseConfigured: () => true, prisma: { user: { updateMany: mocks.updateMany } } }));
vi.mock("@/lib/repositories/auth-token.repository", () => ({ consumeToken: mocks.consumeToken }));

import { POST } from "./route";

let counter = 0;
const call = (body: unknown) =>
  POST(new Request("https://site.test/api/auth/verify-email", { method: "POST", headers: { "x-forwarded-for": `198.20.0.${++counter}` }, body: JSON.stringify(body) }));

const token = "v".repeat(43);

beforeEach(() => {
  mocks.consumeToken.mockReset();
  mocks.updateMany.mockReset();
});

describe("POST /api/auth/verify-email", () => {
  it("подтверждает адрес, к которому привязан токен", async () => {
    mocks.consumeToken.mockResolvedValue("u1:anna@example.com");
    mocks.updateMany.mockResolvedValue({ count: 1 });
    expect((await call({ token })).status).toBe(200);
    expect(mocks.updateMany).toHaveBeenCalledWith({ where: { id: "u1", email: "anna@example.com", deletedAt: null }, data: { emailVerified: expect.any(Date) } });
  });

  it("если адрес сменился или аккаунт удалён, токен не срабатывает", async () => {
    mocks.consumeToken.mockResolvedValue("u1:old@example.com");
    mocks.updateMany.mockResolvedValue({ count: 0 });
    expect((await call({ token })).status).toBe(400);
  });

  it("неверный токен и мусор в теле отвергаются", async () => {
    mocks.consumeToken.mockResolvedValue(null);
    expect((await call({ token })).status).toBe(400);
    expect((await call({ token: "x" })).status).toBe(400);
    expect((await call({})).status).toBe(400);
  });
});
