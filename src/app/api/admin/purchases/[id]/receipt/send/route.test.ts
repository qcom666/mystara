import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAdmin: vi.fn(),
  sendReceiptToBuyer: vi.fn(),
}));

vi.mock("@/lib/admin-guard", () => ({ getAdmin: mocks.getAdmin }));
vi.mock("@/lib/payments/receipt-delivery", () => ({ sendReceiptToBuyer: mocks.sendReceiptToBuyer }));

import { POST } from "./route";

const admin = { id: "admin-1", name: null, email: null };

let counter = 0;
const call = (body?: unknown) =>
  POST(
    new Request("https://site.test/api/admin/purchases/p1/receipt/send", {
      method: "POST",
      headers: { "x-forwarded-for": `198.51.100.${++counter}` },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: "p1" }) },
  );

beforeEach(() => {
  mocks.getAdmin.mockReset();
  mocks.sendReceiptToBuyer.mockReset();
});

describe("POST /api/admin/purchases/[id]/receipt/send", () => {
  it("делает вид, что маршрута нет, для всех, кроме администратора, и ничего не отправляет", async () => {
    mocks.getAdmin.mockResolvedValue(null);
    expect((await call({})).status).toBe(404);
    expect((await call({ manual: true })).status).toBe(404);
    expect(mocks.sendReceiptToBuyer).not.toHaveBeenCalled();
  });

  it("отправляет чек и сообщает каналы", async () => {
    mocks.getAdmin.mockResolvedValue(admin);
    mocks.sendReceiptToBuyer.mockResolvedValue({ ok: true, channels: ["telegram", "email"] });
    const response = await call();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, channels: ["telegram", "email"] });
    expect(mocks.sendReceiptToBuyer).toHaveBeenCalledWith({ purchaseId: "p1", adminId: "admin-1", manual: false });
  });

  it("отметка «выдан вручную» только по явному true", async () => {
    mocks.getAdmin.mockResolvedValue(admin);
    mocks.sendReceiptToBuyer.mockResolvedValue({ ok: true, channels: ["manual"] });
    await call({ manual: true });
    expect(mocks.sendReceiptToBuyer).toHaveBeenLastCalledWith({ purchaseId: "p1", adminId: "admin-1", manual: true });
    await call({ manual: "yes" });
    expect(mocks.sendReceiptToBuyer).toHaveBeenLastCalledWith({ purchaseId: "p1", adminId: "admin-1", manual: false });
  });

  it("сопоставляет ошибки кодам ответа", async () => {
    mocks.getAdmin.mockResolvedValue(admin);
    const cases: [string, number][] = [
      ["not_found", 404],
      ["not_paid", 409],
      ["no_receipt", 409],
      ["no_channel", 409],
      ["conflict", 409],
      ["delivery_failed", 502],
    ];
    for (const [error, status] of cases) {
      mocks.sendReceiptToBuyer.mockResolvedValueOnce({ ok: false, error });
      const response = await call({});
      expect(response.status).toBe(status);
      expect(await response.json()).toEqual({ error });
    }
  });
});
