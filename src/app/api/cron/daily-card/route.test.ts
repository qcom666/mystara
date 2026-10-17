import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  recipients: [] as { chatId: string; language: string }[],
  sent: [] as string[],
  blocked: [] as string[],
}));

vi.mock("@/lib/db", () => ({ isDatabaseConfigured: () => true }));
vi.mock("@/lib/repositories/bot-subscriber.repository", () => ({
  listDailyCardRecipients: async () => mocks.recipients.filter((item) => !mocks.sent.includes(item.chatId) && !mocks.blocked.includes(item.chatId)),
  markDailyCardSent: async (chatId: string) => {
    mocks.sent.push(chatId);
  },
  markSubscriberBlocked: async (chatId: string) => {
    mocks.blocked.push(chatId);
  },
}));

import { GET } from "./route";

const call = (authorization?: string) =>
  GET(new Request("https://mystara.example/api/cron/daily-card", { headers: authorization ? { authorization } : {} }));

const fetchMock = vi.fn();

beforeEach(() => {
  process.env.CRON_SECRET = "cron-secret";
  process.env.TELEGRAM_BOT_TOKEN = "123:TEST";
  process.env.NEXT_PUBLIC_SITE_URL = "https://mystara.example";
  mocks.recipients = [];
  mocks.sent = [];
  mocks.blocked = [];
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /api/cron/daily-card", () => {
  it("без CRON_SECRET закрыт, с чужим секретом отвечает 403 и ничего не шлёт", async () => {
    delete process.env.CRON_SECRET;
    expect((await call("Bearer cron-secret")).status).toBe(503);
    process.env.CRON_SECRET = "cron-secret";
    expect((await call("Bearer wrong")).status).toBe(403);
    expect((await call()).status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("отправляет каждому подписчику его карту и отмечает отправку", async () => {
    mocks.recipients = [
      { chatId: "1", language: "ru" },
      { chatId: "2", language: "en" },
    ];
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const response = await call("Bearer cron-secret");
    expect(await response.json()).toMatchObject({ ok: true, sent: 2, blocked: 0, failed: 0 });
    expect(mocks.sent).toEqual(["1", "2"]);
    const bodies = fetchMock.mock.calls.map(([, init]) => JSON.parse(String((init as RequestInit).body)));
    expect(bodies[0]).toMatchObject({ chat_id: "1" });
    expect(bodies[0].text).toContain("Карта дня");
    expect(bodies[1].text).toContain("Card of the day");
    expect(bodies[0].reply_markup.inline_keyboard[0][0].web_app.url).toMatch(/^https:\/\/mystara\.example\/tarot\/cards\//);
  });

  it("заблокировавших бота помечает, временные ошибки не повторяет по кругу", async () => {
    mocks.recipients = [
      { chatId: "blocked", language: "ru" },
      { chatId: "busy", language: "ru" },
    ];
    fetchMock.mockImplementation(async (_url: string, init: RequestInit) => {
      const chat = JSON.parse(String(init.body)).chat_id;
      return new Response("{}", { status: chat === "blocked" ? 403 : 429 });
    });
    const response = await call("Bearer cron-secret");
    expect(await response.json()).toMatchObject({ sent: 0, blocked: 1, failed: 1 });
    expect(mocks.blocked).toEqual(["blocked"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
