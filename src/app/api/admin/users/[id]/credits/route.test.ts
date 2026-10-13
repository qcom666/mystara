import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAdmin: vi.fn(),
  adjustCredits: vi.fn(),
}));

vi.mock("@/lib/admin-guard", () => ({ getAdmin: mocks.getAdmin }));
vi.mock("@/lib/repositories/admin.repository", () => ({ adjustCredits: mocks.adjustCredits }));

import { POST } from "./route";

const call = (body: unknown) =>
  POST(new Request("https://site.test/api/admin/users/u1/credits", { method: "POST", body: JSON.stringify(body) }), {
    params: Promise.resolve({ id: "u1" }),
  });

beforeEach(() => {
  mocks.getAdmin.mockReset();
  mocks.adjustCredits.mockReset();
});

describe("POST /api/admin/users/[id]/credits", () => {
  it("pretends not to exist for anyone who is not an admin, and changes nothing", async () => {
    mocks.getAdmin.mockResolvedValue(null);
    const response = await call({ delta: 1000, reason: "заберу себе" });
    expect(response.status).toBe(404);
    expect(mocks.adjustCredits).not.toHaveBeenCalled();
  });

  it("adjusts credits for an admin, recording who did it and why", async () => {
    mocks.getAdmin.mockResolvedValue({ id: "admin-1", name: null, email: null });
    mocks.adjustCredits.mockResolvedValue({ ok: true, value: { before: 2, after: 5 } });
    const response = await call({ delta: 3, reason: "  компенсация  " });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ before: 2, after: 5 });
    expect(mocks.adjustCredits).toHaveBeenCalledWith({ adminId: "admin-1", userId: "u1", delta: 3, reason: "компенсация" });
  });

  it.each([
    [{ delta: 0, reason: "ничего" }],
    [{ delta: 1.5, reason: "дробное" }],
    [{ delta: 5000, reason: "слишком много" }],
    [{ delta: 3, reason: "аб" }],
    [{ delta: 3 }],
    [{ delta: "3", reason: "строка" }],
    [null],
  ])("rejects an invalid body %j", async (body) => {
    mocks.getAdmin.mockResolvedValue({ id: "admin-1", name: null, email: null });
    expect((await call(body)).status).toBe(400);
    expect(mocks.adjustCredits).not.toHaveBeenCalled();
  });

  it("reports an unknown user and a negative balance with different statuses", async () => {
    mocks.getAdmin.mockResolvedValue({ id: "admin-1", name: null, email: null });
    mocks.adjustCredits.mockResolvedValueOnce({ ok: false, error: "not_found" });
    expect((await call({ delta: 1, reason: "нет такого" })).status).toBe(404);
    mocks.adjustCredits.mockResolvedValueOnce({ ok: false, error: "negative_balance" });
    expect((await call({ delta: -9, reason: "в минус" })).status).toBe(409);
  });
});
