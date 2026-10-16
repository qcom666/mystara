import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAdmin: vi.fn(),
  refundPurchaseByAdmin: vi.fn(),
}));

vi.mock("@/lib/admin-guard", () => ({ getAdmin: mocks.getAdmin }));
vi.mock("@/lib/payments/refund", () => ({ refundPurchaseByAdmin: mocks.refundPurchaseByAdmin }));

import { POST } from "./route";

let counter = 0;
const call = (body: unknown) =>
  POST(
    new Request("https://site.test/api/admin/purchases/p1/refund", {
      method: "POST",
      // Отдельный адрес на каждый вызов, чтобы ограничение частоты не мешало проверкам.
      headers: { "x-forwarded-for": `198.51.100.${++counter}` },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: "p1" }) },
  );

beforeEach(() => {
  mocks.getAdmin.mockReset();
  mocks.refundPurchaseByAdmin.mockReset();
});

describe("POST /api/admin/purchases/[id]/refund", () => {
  it("делает вид, что маршрута нет, для всех, кроме администратора, и ничего не возвращает", async () => {
    mocks.getAdmin.mockResolvedValue(null);
    expect((await call({ reason: "чужому" })).status).toBe(404);
    expect(mocks.refundPurchaseByAdmin).not.toHaveBeenCalled();
  });

  it("требует причину возврата", async () => {
    mocks.getAdmin.mockResolvedValue({ id: "admin-1", name: null, email: null });
    expect((await call({ reason: "  " })).status).toBe(400);
    expect((await call({})).status).toBe(400);
    expect(mocks.refundPurchaseByAdmin).not.toHaveBeenCalled();
  });

  it("возвращает покупку и передаёт администратора в журнал", async () => {
    mocks.getAdmin.mockResolvedValue({ id: "admin-1", name: null, email: null });
    mocks.refundPurchaseByAdmin.mockResolvedValue({ ok: true, status: "refunded" });
    const response = await call({ reason: "по просьбе покупателя" });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, status: "refunded" });
    expect(mocks.refundPurchaseByAdmin).toHaveBeenCalledWith({ purchaseId: "p1", adminId: "admin-1", reason: "по просьбе покупателя" });
  });

  it("сопоставляет ошибки кодам ответа", async () => {
    mocks.getAdmin.mockResolvedValue({ id: "admin-1", name: null, email: null });
    mocks.refundPurchaseByAdmin.mockResolvedValueOnce({ ok: false, error: "not_found" });
    expect((await call({ reason: "причина" })).status).toBe(404);
    mocks.refundPurchaseByAdmin.mockResolvedValueOnce({ ok: false, error: "already_refunded" });
    expect((await call({ reason: "причина" })).status).toBe(409);
    mocks.refundPurchaseByAdmin.mockResolvedValueOnce({ ok: false, error: "provider_failed" });
    expect((await call({ reason: "причина" })).status).toBe(502);
  });
});
