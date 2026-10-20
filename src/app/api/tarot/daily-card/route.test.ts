import { beforeEach, describe, expect, it, vi } from "vitest";
import { dailyCard, GUEST_DAILY_SUBJECT, moscowDay } from "@/modules/tarot/services/daily-card";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), findTelegramIdByUserId: vi.fn(), dbConfigured: true }));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({ isDatabaseConfigured: () => mocks.dbConfigured }));
vi.mock("@/lib/logger", () => ({ logError: vi.fn() }));
vi.mock("@/lib/repositories/telegram-user.repository", () => ({ findTelegramIdByUserId: mocks.findTelegramIdByUserId }));

import { GET } from "./route";

async function call() {
  const response = await GET();
  return { response, body: await response.json() };
}

beforeEach(() => {
  mocks.auth.mockReset();
  mocks.findTelegramIdByUserId.mockReset();
  mocks.dbConfigured = true;
});

describe("GET /api/tarot/daily-card", () => {
  it("гостю отдаёт общую карту дня и не кэшируется", async () => {
    mocks.auth.mockResolvedValue(null);
    const { response, body } = await call();
    const expected = dailyCard(GUEST_DAILY_SUBJECT, moscowDay());
    expect(body).toEqual({ day: moscowDay(), cardId: expected.card.id, orientation: expected.orientation, kind: "guest" });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mocks.findTelegramIdByUserId).not.toHaveBeenCalled();
  });

  it("у аккаунта с Telegram карта та же, что присылает бот", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u1" } });
    mocks.findTelegramIdByUserId.mockResolvedValue("555");
    const { body } = await call();
    expect(body.kind).toBe("telegram");
    expect(body.cardId).toBe(dailyCard("555", moscowDay()).card.id);
    expect(mocks.findTelegramIdByUserId).toHaveBeenCalledWith("u1");
  });

  it("без Telegram — личная карта по аккаунту, в том числе когда база недоступна", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u1" } });
    mocks.findTelegramIdByUserId.mockResolvedValue(null);
    const expected = dailyCard("user:u1", moscowDay()).card.id;
    expect((await call()).body).toMatchObject({ kind: "account", cardId: expected });

    mocks.findTelegramIdByUserId.mockRejectedValue(new Error("db down"));
    expect((await call()).body).toMatchObject({ kind: "account", cardId: expected });

    mocks.dbConfigured = false;
    expect((await call()).body).toMatchObject({ kind: "account", cardId: expected });
  });
});
