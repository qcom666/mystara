import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), issueToken: vi.fn(), send: vi.fn(), getMailer: vi.fn() }));

vi.mock("@/lib/db", () => ({ isDatabaseConfigured: () => true, prisma: { user: { findFirst: mocks.findUnique } } }));
vi.mock("@/lib/mail/mailer", () => ({ getMailer: mocks.getMailer }));
vi.mock("@/lib/repositories/auth-token.repository", () => ({ issueToken: mocks.issueToken }));

import { POST } from "./route";

let counter = 0;
const call = (body: unknown) =>
  POST(new Request("https://site.test/api/auth/forgot-password", { method: "POST", headers: { "x-forwarded-for": `198.18.0.${++counter}` }, body: JSON.stringify(body) }));

beforeEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = "https://mystara.example";
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.getMailer.mockReturnValue({ send: mocks.send });
  mocks.issueToken.mockResolvedValue("TOKEN123");
});

describe("POST /api/auth/forgot-password", () => {
  it("без настроенной почты честно отвечает 503 и ничего не ищет", async () => {
    mocks.getMailer.mockReturnValue(null);
    expect((await call({ email: "a@example.com" })).status).toBe(503);
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("отправляет письмо со ссылкой существующему аккаунту с паролем", async () => {
    mocks.findUnique.mockResolvedValue({ id: "u1", passwordHash: "hash", deletedAt: null });
    expect((await call({ email: "a@example.com" })).status).toBe(200);
    expect(mocks.issueToken).toHaveBeenCalledWith("reset", "u1", 60 * 60 * 1000);
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(mocks.send.mock.calls[0][0]).toMatchObject({ to: "a@example.com" });
    expect(mocks.send.mock.calls[0][0].text).toContain("https://mystara.example/reset-password?token=TOKEN123");
  });

  it("на несуществующий адрес, аккаунт без пароля и удалённый отвечает так же и не пишет", async () => {
    for (const user of [null, { id: "u2", passwordHash: null, deletedAt: null }, { id: "u3", passwordHash: "h", deletedAt: new Date() }]) {
      mocks.findUnique.mockResolvedValue(user);
      const response = await call({ email: "nobody@example.com" });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ ok: true });
    }
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("сбой отправки не выдаёт, существует ли адрес", async () => {
    mocks.findUnique.mockResolvedValue({ id: "u1", passwordHash: "hash", deletedAt: null });
    mocks.send.mockRejectedValue(new Error("smtp down"));
    expect((await call({ email: "a@example.com" })).status).toBe(200);
  });

  it("проверяет адрес и ограничивает письма на один адрес", async () => {
    expect((await call({ email: "не-почта" })).status).toBe(400);
    mocks.findUnique.mockResolvedValue(null);
    const email = "limit@example.com";
    const statuses = [];
    for (let i = 0; i < 5; i++) statuses.push((await call({ email })).status);
    expect(statuses).toEqual([200, 200, 200, 429, 429]);
  });
});
