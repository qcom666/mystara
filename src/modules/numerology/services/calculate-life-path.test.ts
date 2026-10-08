import { describe, expect, it } from "vitest";
import { calculateLifePathNumber } from "./calculate-life-path";

const VALID_LIFE_PATH_NUMBERS = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]);

describe("calculateLifePathNumber", () => {
  it("matches a hand-verified example (1990-01-01 -> 3)", () => {
    // день 1 → 1, месяц 1 → 1, год 1990 → 1+9+9+0=19; сумма 21 → 2+1 = 3
    expect(calculateLifePathNumber(new Date(1990, 0, 1))).toBe(3);
  });

  it("preserves a master number instead of reducing it further (2000-09-29 -> 22)", () => {
    // день 29 → 2+9=11, месяц 9 → 9, год 2000 → 2; сумма 22, уже мастер-число
    expect(calculateLifePathNumber(new Date(2000, 8, 29))).toBe(22);
  });

  it("is deterministic for the same date", () => {
    const date = new Date(1988, 6, 14);
    expect(calculateLifePathNumber(date)).toBe(calculateLifePathNumber(new Date(date)));
  });

  it("always returns a value in the valid life path set across a range of dates", () => {
    for (let year = 1950; year < 2020; year += 3) {
      for (let month = 0; month < 12; month += 2) {
        const number = calculateLifePathNumber(new Date(year, month, 15));
        expect(VALID_LIFE_PATH_NUMBERS.has(number)).toBe(true);
      }
    }
  });
});
