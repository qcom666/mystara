import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fulfillPayment: vi.fn(),
  getFulfilledPurchaseSummary: vi.fn(),
  getPurchaseProduct: vi.fn(async () => "premium_month"),
  isPurchasePayable: vi.fn(),
  setStarSubscriptionState: vi.fn(),
  recordEvent: vi.fn(async () => undefined),
}));

vi.mock("@/lib/db", () => ({ isDatabaseConfigured: () => true }));
vi.mock("@/lib/analytics-store", () => ({ recordEvent: mocks.recordEvent }));
vi.mock("@/lib/repositories/purchase.repository", () => ({
  fulfillPayment: mocks.fulfillPayment,
  getFulfilledPurchaseSummary: mocks.getFulfilledPurchaseSummary,
  getPurchaseProduct: mocks.getPurchaseProduct,
  isPurchasePayable: mocks.isPurchasePayable,
}));
vi.mock("@/lib/repositories/star-subscription.repository", () => ({ setStarSubscriptionState: mocks.setStarSubscriptionState }));
vi.mock("@/lib/repositories/bot-subscriber.repository", () => ({ subscribeDailyCard: vi.fn(), unsubscribeDailyCard: vi.fn() }));
vi.mock("@/lib/repositories/telegram-user.repository", () => ({ rememberTelegramLanguage: vi.fn(async () => undefined) }));

import { POST } from "./route";

const SECRET = "webhook-secret";
const post = (update: unknown) =>
  POST(
    new Request("https://site.test/api/telegram/webhook", {
      method: "POST",
      headers: { "content-type": "application/json", "x-telegram-bot-api-secret-token": SECRET },
      body: JSON.stringify(update),
    }),
  );

beforeEach(() => {
  vi.stubEnv("TELEGRAM_WEBHOOK_SECRET", SECRET);
  Object.values(mocks).forEach((mock) => mock.mockClear());
});

describe("вебхук: подписка Звёздами с автопродлением", () => {
  it("повторное списание выдаётся отдельной покупкой со сроком от Telegram, покупатель получает сообщение о продлении", async () => {
    mocks.fulfillPayment.mockResolvedValue({ result: "fulfilled", purchaseId: "renewal-1" });
    mocks.getFulfilledPurchaseSummary.mockResolvedValue({
      product: "premium_month",
      creditsGranted: 0,
      credits: 0,
      telegramId: "42",
      language: "ru",
      premiumUntil: new Date("2026-12-31T09:00:00Z"),
      renewal: true,
      nextChargeAt: new Date("2026-12-31T09:00:00Z"),
    });
    const response = await post({
      message: {
        date: 1_796_000_000,
        chat: { id: 42, type: "private" },
        from: { id: 42, language_code: "ru" },
        successful_payment: {
          currency: "XTR",
          total_amount: 150,
          invoice_payload: "sub1",
          telegram_payment_charge_id: "charge-2",
          is_recurring: true,
          subscription_expiration_date: 1_798_592_000,
        },
      },
    });

    expect(mocks.fulfillPayment).toHaveBeenCalledWith({
      purchaseId: "sub1",
      provider: "stars",
      externalId: "charge-2",
      amount: 150,
      currency: "XTR",
      subscription: { chargedAt: new Date(1_796_000_000_000), expiresAt: new Date(1_798_592_000_000), telegramUserId: "42" },
    });
    expect(mocks.getFulfilledPurchaseSummary).toHaveBeenCalledWith("renewal-1");
    expect(mocks.recordEvent).toHaveBeenCalledWith({ name: "subscription_renewed", provider: "stars" }, { shell: "telegram" });
    const body = await response.json();
    expect(body).toMatchObject({ method: "sendMessage", chat_id: 42 });
    expect(body.text).toMatch(/Premium продлён до 31 декабря 2026.*следующее списание/);
  });

  it("повтор уже записанного списания ничего не шлёт", async () => {
    mocks.fulfillPayment.mockResolvedValue({ result: "already_paid", purchaseId: "renewal-1" });
    const response = await post({
      message: {
        chat: { id: 42 },
        from: { id: 42 },
        successful_payment: { currency: "XTR", total_amount: 150, invoice_payload: "sub1", telegram_payment_charge_id: "charge-2", is_recurring: true },
      },
    });
    expect(await response.json()).toEqual({ ok: true });
    expect(mocks.recordEvent).not.toHaveBeenCalled();
  });

  it("отмена в Telegram запоминается и подтверждается сообщением с концом оплаченного срока", async () => {
    mocks.setStarSubscriptionState.mockResolvedValue({
      state: "canceled",
      expiresAt: new Date("2026-12-01T09:00:00Z"),
      user: { telegramId: "42", language: "ru", subscription: { currentPeriodEnd: new Date("2026-12-01T09:00:00Z") } },
    });
    const response = await post({ subscription: { user: { id: 42, language_code: "ru" }, invoice_payload: "sub1", state: "canceled" } });
    expect(mocks.setStarSubscriptionState).toHaveBeenCalledWith("sub1", "canceled", { canceledBy: "user", telegramUserId: "42" });
    const body = await response.json();
    expect(body).toMatchObject({ method: "sendMessage", chat_id: 42 });
    expect(body.text).toContain("Автопродление Premium отключено");
    expect(body.reply_markup.inline_keyboard[0][0].web_app.url).toBe("https://site.test/pricing");
  });

  it("обновление о неизвестной подписке принимается без ответа пользователю", async () => {
    mocks.setStarSubscriptionState.mockResolvedValue(null);
    const response = await post({ subscription: { user: { id: 42 }, invoice_payload: "nope", state: "failed" } });
    expect(await response.json()).toEqual({ ok: true });
  });
});
