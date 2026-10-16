import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  markPurchaseRefunded: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma: { purchase: { findUnique: mocks.findUnique } } }));
vi.mock("@/lib/repositories/purchase.repository", () => ({ markPurchaseRefunded: mocks.markPurchaseRefunded }));

import { refundPurchaseByAdmin } from "./refund";

const input = { purchaseId: "p1", adminId: "admin-1", reason: "по просьбе покупателя" };
const env = { TELEGRAM_BOT_TOKEN: "123:TEST", YOOKASSA_SHOP_ID: "shop", YOOKASSA_SECRET_KEY: "key" };

function purchase(overrides: Record<string, unknown> = {}) {
  return {
    id: "p1",
    userId: "u1",
    status: "paid",
    provider: "yookassa",
    amount: 1000,
    externalId: "pay-1",
    user: { telegramId: "42" },
    ...overrides,
  };
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

beforeEach(() => {
  mocks.findUnique.mockReset();
  mocks.markPurchaseRefunded.mockReset();
  mocks.markPurchaseRefunded.mockResolvedValue("refunded");
});

describe("refundPurchaseByAdmin", () => {
  it("ЮKassa: возврат прошёл сразу, выданное снимается", async () => {
    mocks.findUnique.mockResolvedValue(purchase());
    const fetchImpl = vi.fn().mockResolvedValue(json({ id: "ref-1", status: "succeeded" }));
    await expect(refundPurchaseByAdmin(input, env, fetchImpl)).resolves.toEqual({ ok: true, status: "refunded" });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.yookassa.ru/v3/refunds");
    expect((init as RequestInit).headers).toMatchObject({ "Idempotence-Key": "refund-p1" });
    expect(JSON.parse(String((init as RequestInit).body))).toEqual({ payment_id: "pay-1", amount: { value: "1000.00", currency: "RUB" } });
    expect(mocks.markPurchaseRefunded).toHaveBeenCalledWith("p1", { actor: "admin-1", reason: input.reason });
  });

  it("ЮKassa: возврат в обработке, покупка остаётся оплаченной до уведомления", async () => {
    mocks.findUnique.mockResolvedValue(purchase());
    const fetchImpl = vi.fn().mockResolvedValue(json({ id: "ref-1", status: "pending" }));
    await expect(refundPurchaseByAdmin(input, env, fetchImpl)).resolves.toEqual({ ok: true, status: "pending" });
    expect(mocks.markPurchaseRefunded).not.toHaveBeenCalled();
  });

  it("ЮKassa: отказ провайдера ничего не меняет в базе", async () => {
    mocks.findUnique.mockResolvedValue(purchase());
    const fetchImpl = vi.fn().mockResolvedValue(json({ type: "error" }, 400));
    await expect(refundPurchaseByAdmin(input, env, fetchImpl)).resolves.toEqual({ ok: false, error: "provider_failed" });
    expect(mocks.markPurchaseRefunded).not.toHaveBeenCalled();
  });

  it("Звёзды: возвращает платёж по Telegram ID и идентификатору транзакции", async () => {
    mocks.findUnique.mockResolvedValue(purchase({ provider: "stars", amount: 500, externalId: "charge-9" }));
    const fetchImpl = vi.fn().mockResolvedValue(json({ ok: true, result: true }));
    await expect(refundPurchaseByAdmin(input, env, fetchImpl)).resolves.toEqual({ ok: true, status: "refunded" });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.telegram.org/bot123:TEST/refundStarPayment");
    expect(JSON.parse(String((init as RequestInit).body))).toEqual({ user_id: 42, telegram_payment_charge_id: "charge-9" });
    expect(mocks.markPurchaseRefunded).toHaveBeenCalled();
  });

  it("Звёзды: без Telegram ID у пользователя вернуть нельзя", async () => {
    mocks.findUnique.mockResolvedValue(purchase({ provider: "stars", user: { telegramId: null } }));
    const fetchImpl = vi.fn();
    await expect(refundPurchaseByAdmin(input, env, fetchImpl)).resolves.toEqual({ ok: false, error: "no_telegram_user" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("не возвращает неоплаченную, уже возвращённую и несуществующую покупки", async () => {
    const fetchImpl = vi.fn();
    mocks.findUnique.mockResolvedValue(purchase({ status: "pending" }));
    await expect(refundPurchaseByAdmin(input, env, fetchImpl)).resolves.toEqual({ ok: false, error: "not_paid" });
    mocks.findUnique.mockResolvedValue(purchase({ status: "refunded" }));
    await expect(refundPurchaseByAdmin(input, env, fetchImpl)).resolves.toEqual({ ok: false, error: "already_refunded" });
    mocks.findUnique.mockResolvedValue(null);
    await expect(refundPurchaseByAdmin(input, env, fetchImpl)).resolves.toEqual({ ok: false, error: "not_found" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("без ключей платёжной системы сообщает, что способ не настроен", async () => {
    mocks.findUnique.mockResolvedValue(purchase());
    await expect(refundPurchaseByAdmin(input, {}, vi.fn())).resolves.toEqual({ ok: false, error: "not_configured" });
  });
});
