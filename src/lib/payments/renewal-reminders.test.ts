import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ list: vi.fn(), mark: vi.fn() }));
vi.mock("@/lib/repositories/subscription.repository", () => ({ listSubscriptionsToRemind: mocks.list, markRenewalReminded: mocks.mark }));
vi.mock("@/lib/mail/mailer", () => ({ getMailer: () => null }));

import { renewalReminderText, sendRenewalReminders } from "./renewal-reminders";

const now = new Date("2026-10-17T06:30:00Z");
const end = new Date("2026-10-19T12:00:00Z");
const row = (user: { telegramId?: string | null; email?: string | null; language?: string }) => ({
  userId: `u-${user.telegramId ?? user.email}`,
  currentPeriodEnd: end,
  renewalReminderFor: null,
  user: { telegramId: user.telegramId ?? null, email: user.email ?? null, language: user.language ?? "ru" },
});
const telegram = (status: number) => vi.fn(async () => new Response("{}", { status }));
const run = (fetchImpl: unknown, mailer: { send: (m: unknown) => Promise<void> } | null = null) =>
  sendRenewalReminders(now, { siteUrl: "https://site.test", limit: 10, botToken: "t", mailer, fetchImpl: fetchImpl as never, pauseMs: 0 });

beforeEach(() => {
  mocks.list.mockReset();
  mocks.mark.mockReset();
});

describe("напоминание о продлении Premium", () => {
  it("текст с датой окончания по Москве", () => {
    expect(renewalReminderText(end, "ru")).toContain("действует до 19 октября");
    expect(renewalReminderText(end, "en")).toContain("active until 19 October");
  });

  it("ищет подписки, которые закончатся в ближайшие 3 дня", async () => {
    mocks.list.mockResolvedValue([]);
    await run(telegram(200));
    expect(mocks.list).toHaveBeenCalledWith(now, new Date("2026-10-20T06:30:00Z"), 10);
  });

  it("доставлено в Telegram и на почту — срок отмечен", async () => {
    mocks.list.mockResolvedValue([row({ telegramId: "1", email: "a@x.test" })]);
    const send = vi.fn(async () => undefined);
    const fetchImpl = telegram(200);
    await expect(run(fetchImpl, { send })).resolves.toMatchObject({ telegram: 1, email: 1 });
    expect(JSON.parse((fetchImpl.mock.calls[0] as unknown as [string, { body: string }])[1].body)).toMatchObject({
      chat_id: "1",
      reply_markup: { inline_keyboard: [[{ web_app: { url: "https://site.test/pricing" } }]] },
    });
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ to: "a@x.test" }));
    expect(mocks.mark).toHaveBeenCalledWith("u-1", end);
  });

  it("бот заблокирован и почты нет — больше не пишем (отмечаем как недоступного)", async () => {
    mocks.list.mockResolvedValue([row({ telegramId: "2" })]);
    await expect(run(telegram(403))).resolves.toMatchObject({ unreachable: 1 });
    expect(mocks.mark).toHaveBeenCalled();
  });

  it("временная ошибка Telegram — не отмечаем, попробуем завтра", async () => {
    mocks.list.mockResolvedValue([row({ telegramId: "3" })]);
    await expect(run(telegram(429))).resolves.toMatchObject({ retryLater: 1 });
    expect(mocks.mark).not.toHaveBeenCalled();
  });

  it("нет ни Telegram, ни почты — отмечаем, чтобы не перебирать каждый день", async () => {
    mocks.list.mockResolvedValue([row({ email: null, telegramId: null })]);
    await expect(run(telegram(200))).resolves.toMatchObject({ unreachable: 1, telegram: 0 });
    expect(mocks.mark).toHaveBeenCalled();
  });
});
