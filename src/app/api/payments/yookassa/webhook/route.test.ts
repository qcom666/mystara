import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchPayment: vi.fn(),
  fetchRefund: vi.fn(),
  fulfillPurchase: vi.fn(),
  findPurchase: vi.fn(),
  markRefunded: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ isDatabaseConfigured: () => true }));
vi.mock("@/lib/payments/providers/yookassa", () => ({
  fetchYooKassaPayment: mocks.fetchPayment,
  fetchYooKassaRefund: mocks.fetchRefund,
}));
vi.mock("@/lib/analytics-store", () => ({ recordEvent: async () => true }));
vi.mock("@/lib/repositories/purchase.repository", () => ({
  getPurchaseProduct: async () => "natal_pack",
  fulfillPurchase: mocks.fulfillPurchase,
  findYooKassaPurchaseByPaymentId: mocks.findPurchase,
  markPurchaseRefunded: mocks.markRefunded,
}));

import { POST } from "./route";

const notify = (body: unknown) => POST(new Request("https://site.test/api/payments/yookassa/webhook", { method: "POST", body: JSON.stringify(body) }));

beforeEach(() => {
  process.env.YOOKASSA_SHOP_ID = "shop";
  process.env.YOOKASSA_SECRET_KEY = "key";
  for (const mock of Object.values(mocks)) mock.mockReset();
});

describe("уведомление ЮKassa о возврате (refund.succeeded)", () => {
  const refund = { id: "ref-1", status: "succeeded", payment_id: "pay-1", amount: { value: "1000.00", currency: "RUB" } };

  it("полный возврат: забирает выданное, данные берёт из ответа ЮKassa, а не из тела уведомления", async () => {
    mocks.fetchRefund.mockResolvedValue(refund);
    mocks.findPurchase.mockResolvedValue({ id: "p1", amount: 1000 });
    const response = await notify({ event: "refund.succeeded", object: { id: "ref-1", payment_id: "подмена" } });
    expect(response.status).toBe(200);
    expect(mocks.findPurchase).toHaveBeenCalledWith("pay-1");
    expect(mocks.markRefunded).toHaveBeenCalledWith("p1", { actor: "system:yookassa", reason: "Возврат ЮKassa ref-1" });
  });

  it("частичный возврат автоматически не обрабатывается", async () => {
    mocks.fetchRefund.mockResolvedValue({ ...refund, amount: { value: "300.00", currency: "RUB" } });
    mocks.findPurchase.mockResolvedValue({ id: "p1", amount: 1000 });
    await notify({ event: "refund.succeeded", object: { id: "ref-1" } });
    expect(mocks.markRefunded).not.toHaveBeenCalled();
  });

  it("возврат, которого ЮKassa не подтвердила, игнорируется", async () => {
    mocks.fetchRefund.mockResolvedValue({ ...refund, status: "pending" });
    await notify({ event: "refund.succeeded", object: { id: "ref-1" } });
    mocks.fetchRefund.mockResolvedValue(null);
    await notify({ event: "refund.succeeded", object: { id: "ref-1" } });
    expect(mocks.findPurchase).not.toHaveBeenCalled();
    expect(mocks.markRefunded).not.toHaveBeenCalled();
  });

  it("неизвестная покупка и посторонние события отвечают 200 без последствий", async () => {
    mocks.fetchRefund.mockResolvedValue(refund);
    mocks.findPurchase.mockResolvedValue(null);
    expect((await notify({ event: "refund.succeeded", object: { id: "ref-1" } })).status).toBe(200);
    expect((await notify({ event: "payment.canceled", object: { id: "x" } })).status).toBe(200);
    expect(mocks.markRefunded).not.toHaveBeenCalled();
  });
});

describe("уведомление об оплате (payment.succeeded) продолжает работать", () => {
  it("выдаёт купленное по данным ЮKassa", async () => {
    mocks.fetchPayment.mockResolvedValue({ id: "pay-1", status: "succeeded", paid: true, metadata: { purchaseId: "p1" }, amount: { value: "1000.00", currency: "RUB" } });
    mocks.fulfillPurchase.mockResolvedValue("fulfilled");
    expect((await notify({ event: "payment.succeeded", object: { id: "pay-1" } })).status).toBe(200);
    expect(mocks.fulfillPurchase).toHaveBeenCalledWith({ purchaseId: "p1", provider: "yookassa", externalId: "pay-1", amount: 1000, currency: "RUB" });
  });
});
