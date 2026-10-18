import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAdmin: vi.fn(),
  attachReceipt: vi.fn(),
}));

vi.mock("@/lib/admin-guard", () => ({ getAdmin: mocks.getAdmin }));
vi.mock("@/lib/repositories/receipt.repository", () => ({ attachReceipt: mocks.attachReceipt }));

import { PUT } from "./route";

const RECEIPT = "https://lknpd.nalog.ru/api/v1/receipt/771234567890/20abcdef12/print";
const admin = { id: "admin-1", name: null, email: null };

let counter = 0;
const call = (body: unknown) =>
  PUT(
    new Request("https://site.test/api/admin/purchases/p1/receipt", {
      method: "PUT",
      // Отдельный адрес на каждый вызов, чтобы ограничение частоты не мешало проверкам.
      headers: { "x-forwarded-for": `198.51.100.${++counter}` },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: "p1" }) },
  );

beforeEach(() => {
  mocks.getAdmin.mockReset();
  mocks.attachReceipt.mockReset();
});

describe("PUT /api/admin/purchases/[id]/receipt", () => {
  it("делает вид, что маршрута нет, для всех, кроме администратора", async () => {
    mocks.getAdmin.mockResolvedValue(null);
    const response = await call({ url: RECEIPT });
    expect(response.status).toBe(404);
    expect(mocks.attachReceipt).not.toHaveBeenCalled();
  });

  it("принимает только ссылку на чек «Мой налог»", async () => {
    mocks.getAdmin.mockResolvedValue(admin);
    for (const url of ["http://lknpd.nalog.ru/api/v1/receipt/1/2/print", "https://evil.example/receipt", "", undefined]) {
      const response = await call({ url });
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "invalid_url" });
    }
    expect(mocks.attachReceipt).not.toHaveBeenCalled();
  });

  it("сохраняет ссылку от имени администратора", async () => {
    mocks.getAdmin.mockResolvedValue(admin);
    mocks.attachReceipt.mockResolvedValue({ ok: true, changed: true });
    const response = await call({ url: `  ${RECEIPT} ` });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, changed: true, receiptUrl: RECEIPT });
    expect(mocks.attachReceipt).toHaveBeenCalledWith({ purchaseId: "p1", adminId: "admin-1", receiptUrl: RECEIPT });
  });

  it("сопоставляет ошибки кодам ответа", async () => {
    mocks.getAdmin.mockResolvedValue(admin);
    mocks.attachReceipt.mockResolvedValueOnce({ ok: false, error: "not_found" });
    expect((await call({ url: RECEIPT })).status).toBe(404);
    mocks.attachReceipt.mockResolvedValueOnce({ ok: false, error: "not_paid" });
    expect((await call({ url: RECEIPT })).status).toBe(409);
  });
});
