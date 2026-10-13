import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAdmin: vi.fn(),
  extendPremiumByAdmin: vi.fn(),
  endPremiumByAdmin: vi.fn(),
}));

vi.mock("@/lib/admin-guard", () => ({ getAdmin: mocks.getAdmin }));
vi.mock("@/lib/repositories/admin.repository", () => ({
  extendPremiumByAdmin: mocks.extendPremiumByAdmin,
  endPremiumByAdmin: mocks.endPremiumByAdmin,
}));

import { POST } from "./route";

const call = (body: unknown) =>
  POST(new Request("https://site.test/api/admin/users/u1/premium", { method: "POST", body: JSON.stringify(body) }), {
    params: Promise.resolve({ id: "u1" }),
  });

const admin = { id: "admin-1", name: null, email: null };

beforeEach(() => {
  mocks.getAdmin.mockReset();
  mocks.extendPremiumByAdmin.mockReset();
  mocks.endPremiumByAdmin.mockReset();
});

describe("POST /api/admin/users/[id]/premium", () => {
  it("pretends not to exist for anyone who is not an admin, and changes nothing", async () => {
    mocks.getAdmin.mockResolvedValue(null);
    expect((await call({ action: "extend", days: 365, reason: "себе в подарок" })).status).toBe(404);
    expect((await call({ action: "end", reason: "чужому" })).status).toBe(404);
    expect(mocks.extendPremiumByAdmin).not.toHaveBeenCalled();
    expect(mocks.endPremiumByAdmin).not.toHaveBeenCalled();
  });

  it("extends Premium by a number of days", async () => {
    mocks.getAdmin.mockResolvedValue(admin);
    mocks.extendPremiumByAdmin.mockResolvedValue({ ok: true, value: { before: null, after: new Date() } });
    expect((await call({ action: "extend", days: 30, reason: "подарок" })).status).toBe(200);
    expect(mocks.extendPremiumByAdmin).toHaveBeenCalledWith({ adminId: "admin-1", userId: "u1", days: 30, reason: "подарок" });
  });

  it("ends Premium immediately", async () => {
    mocks.getAdmin.mockResolvedValue(admin);
    mocks.endPremiumByAdmin.mockResolvedValue({ ok: true, value: { before: null } });
    expect((await call({ action: "end", reason: "возврат платежа" })).status).toBe(200);
    expect(mocks.endPremiumByAdmin).toHaveBeenCalledWith({ adminId: "admin-1", userId: "u1", reason: "возврат платежа" });
  });

  it.each([
    [{ action: "extend", days: 0, reason: "ноль" }],
    [{ action: "extend", days: 366, reason: "слишком долго" }],
    [{ action: "extend", days: 2.5, reason: "дробно" }],
    [{ action: "extend", reason: "без срока" }],
    [{ action: "extend", days: 30 }],
    [{ action: "end" }],
    [{ action: "delete", reason: "неизвестное" }],
    [null],
  ])("rejects an invalid body %j", async (body) => {
    mocks.getAdmin.mockResolvedValue(admin);
    expect((await call(body)).status).toBe(400);
    expect(mocks.extendPremiumByAdmin).not.toHaveBeenCalled();
    expect(mocks.endPremiumByAdmin).not.toHaveBeenCalled();
  });

  it("answers 404 when the user or subscription does not exist", async () => {
    mocks.getAdmin.mockResolvedValue(admin);
    mocks.endPremiumByAdmin.mockResolvedValue({ ok: false, error: "not_found" });
    expect((await call({ action: "end", reason: "нет подписки" })).status).toBe(404);
  });
});
