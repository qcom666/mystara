import { describe, expect, it } from "vitest";
import { calculateSunSign } from "./calculate-sun-sign";

describe("calculateSunSign", () => {
  it("resolves boundary dates to the correct sign", () => {
    expect(calculateSunSign(new Date(2000, 2, 21)).id).toBe("aries"); // Mar 21 - start of Aries
    expect(calculateSunSign(new Date(2000, 3, 19)).id).toBe("aries"); // Apr 19 - last day of Aries
    expect(calculateSunSign(new Date(2000, 3, 20)).id).toBe("taurus"); // Apr 20 - first day of Taurus
  });

  it("handles the year-wraparound sign (Capricorn) on both sides of the boundary", () => {
    expect(calculateSunSign(new Date(2000, 11, 22)).id).toBe("capricorn"); // Dec 22
    expect(calculateSunSign(new Date(2000, 11, 31)).id).toBe("capricorn"); // Dec 31
    expect(calculateSunSign(new Date(2000, 0, 1)).id).toBe("capricorn"); // Jan 1
    expect(calculateSunSign(new Date(2000, 0, 19)).id).toBe("capricorn"); // Jan 19 - last day
    expect(calculateSunSign(new Date(2000, 0, 20)).id).toBe("aquarius"); // Jan 20 - next sign starts
  });

  it("resolves a date in the middle of a range correctly", () => {
    expect(calculateSunSign(new Date(2000, 6, 1)).id).toBe("cancer"); // Jul 1
  });

  it("works on a leap day", () => {
    expect(calculateSunSign(new Date(2000, 1, 29)).id).toBe("pisces"); // Feb 29
  });
});
