import { describe, expect, it } from "vitest";
import { calculateSunSign } from "./calculate-sun-sign";

describe("calculateSunSign", () => {
  it("resolves boundary dates to the correct sign", () => {
    expect(calculateSunSign(new Date(2000, 2, 21)).id).toBe("aries"); // 21 марта — начало Овна
    expect(calculateSunSign(new Date(2000, 3, 19)).id).toBe("aries"); // 19 апреля — последний день Овна
    expect(calculateSunSign(new Date(2000, 3, 20)).id).toBe("taurus"); // 20 апреля — первый день Тельца
  });

  it("handles the year-wraparound sign (Capricorn) on both sides of the boundary", () => {
    expect(calculateSunSign(new Date(2000, 11, 22)).id).toBe("capricorn"); // 22 декабря
    expect(calculateSunSign(new Date(2000, 11, 31)).id).toBe("capricorn"); // 31 декабря
    expect(calculateSunSign(new Date(2000, 0, 1)).id).toBe("capricorn"); // 1 января
    expect(calculateSunSign(new Date(2000, 0, 19)).id).toBe("capricorn"); // 19 января — последний день
    expect(calculateSunSign(new Date(2000, 0, 20)).id).toBe("aquarius"); // 20 января — начинается следующий знак
  });

  it("resolves a date in the middle of a range correctly", () => {
    expect(calculateSunSign(new Date(2000, 6, 1)).id).toBe("cancer"); // 1 июля
  });

  it("works on a leap day", () => {
    expect(calculateSunSign(new Date(2000, 1, 29)).id).toBe("pisces"); // 29 февраля
  });
});
