import { describe, expect, it } from "vitest";
import { normalizePromoCode } from "./promo.repository";

describe("normalizePromoCode", () => {
  it("приводит к верхнему регистру и проверяет символы", () => {
    expect(normalizePromoCode("  start-2026 ")).toBe("START-2026");
    for (const bad of ["ab", "код", "A B C", "X".repeat(33), "ABC;DROP"]) expect(normalizePromoCode(bad)).toBeNull();
  });
});
