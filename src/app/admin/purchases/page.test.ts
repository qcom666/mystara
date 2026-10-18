import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUser: vi.fn(),
  listPurchases: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({ isDatabaseConfigured: () => true, prisma: { user: { findUnique: mocks.findUser } } }));
vi.mock("@/lib/repositories/admin.repository", () => ({ listPurchases: mocks.listPurchases }));

import AdminPurchasesPage from "./page";

const page = (status?: string) => AdminPurchasesPage({ searchParams: Promise.resolve(status ? { status } : {}) });

beforeEach(() => {
  vi.stubEnv("ADMIN_USER_IDS", "admin-1");
  vi.stubEnv("ADMIN_TELEGRAM_IDS", "");
  mocks.auth.mockReset();
  mocks.findUser.mockReset();
  mocks.listPurchases.mockReset();
  mocks.listPurchases.mockResolvedValue([]);
});

describe("/admin/purchases", () => {
  it("гостю и обычному пользователю отвечает «не найдено» и покупки не читает", async () => {
    mocks.auth.mockResolvedValue(null);
    await expect(page("no_receipt")).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });

    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.findUser.mockResolvedValue({ id: "user-1", name: null, email: "user@example.com", telegramId: null });
    await expect(page("no_receipt")).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
    expect(mocks.listPurchases).not.toHaveBeenCalled();
  });

  it("администратору фильтр «чек не выдан» показывает оплаченные без выданного чека", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "admin-1" } });
    mocks.findUser.mockResolvedValue({ id: "admin-1", name: null, email: null, telegramId: null });
    await page("no_receipt");
    expect(mocks.listPurchases).toHaveBeenCalledWith({ withoutReceipt: true });
    await page("paid");
    expect(mocks.listPurchases).toHaveBeenLastCalledWith({ status: "paid" });
  });
});
