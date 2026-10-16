import { createHash, createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), linkTelegramToUser: vi.fn() }));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({ isDatabaseConfigured: () => true }));
vi.mock("@/lib/repositories/account-link.repository", () => ({ linkTelegramToUser: mocks.linkTelegramToUser }));

import { POST } from "./route";

const BOT_TOKEN = "123456:TEST-token-for-unit-tests";

function signed(fields: Record<string, string>, token = BOT_TOKEN) {
  const dcs = Object.keys(fields).sort().map((key) => `${key}=${fields[key]}`).join("\n");
  const hash = createHmac("sha256", createHash("sha256").update(token).digest()).update(dcs).digest("hex");
  return JSON.stringify({ ...fields, hash });
}

let counter = 0;
const call = (body: unknown) =>
  POST(new Request("https://site.test/api/account/link-telegram", { method: "POST", headers: { "x-forwarded-for": `192.0.2.${++counter}` }, body: JSON.stringify(body) }));

const fresh = () => ({ id: "555", first_name: "Анна", auth_date: String(Math.floor(Date.now() / 1000)) });

beforeEach(() => {
  process.env.TELEGRAM_BOT_TOKEN = BOT_TOKEN;
  mocks.auth.mockReset();
  mocks.linkTelegramToUser.mockReset();
});

describe("POST /api/account/link-telegram", () => {
  it("требует вход в аккаунт", async () => {
    mocks.auth.mockResolvedValue(null);
    expect((await call({ widgetData: signed(fresh()) })).status).toBe(401);
  });

  it("отвергает данные с чужой подписью и не привязывает ничего", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u1" } });
    expect((await call({ widgetData: signed(fresh(), "999:other") })).status).toBe(400);
    expect((await call({ widgetData: "не json" })).status).toBe(400);
    expect(mocks.linkTelegramToUser).not.toHaveBeenCalled();
  });

  it("привязывает Telegram из подписанных данных к аккаунту из сессии", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u1" } });
    mocks.linkTelegramToUser.mockResolvedValue("ok");
    expect((await call({ widgetData: signed(fresh()) })).status).toBe(200);
    expect(mocks.linkTelegramToUser).toHaveBeenCalledWith("u1", expect.objectContaining({ id: 555, firstName: "Анна" }));
  });

  it("сообщает, что Telegram уже занят аккаунтом с данными", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u1" } });
    mocks.linkTelegramToUser.mockResolvedValue("telegram_taken");
    const response = await call({ widgetData: signed(fresh()) });
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "telegram_taken" });
  });
});
