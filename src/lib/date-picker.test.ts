import { describe, expect, it } from "vitest";
import {
  addMonths,
  buildMonthGrid,
  compareYmd,
  daysInMonth,
  formatDisplayDate,
  isValidYmd,
  isWithinRange,
  maskTypedDate,
  parseIsoDate,
  parseTypedDate,
  toIsoDate,
  weekdayMondayFirst,
} from "./date-picker";

describe("parseIsoDate / toIsoDate", () => {
  it("round-trips a real date", () => {
    expect(parseIsoDate("1990-05-15")).toEqual({ year: 1990, month: 5, day: 15 });
    expect(toIsoDate({ year: 1990, month: 5, day: 15 })).toBe("1990-05-15");
    expect(toIsoDate({ year: 987, month: 1, day: 2 })).toBe("0987-01-02");
  });

  it("rejects malformed and impossible dates", () => {
    for (const value of ["", "1990-5-15", "15.05.1990", "1990-13-01", "1990-00-10", "1990-02-30", "2025-02-29", "1990-05-32", "abcd-ef-gh", "0999-01-01"]) {
      expect(parseIsoDate(value)).toBeNull();
    }
  });

  it("knows leap years", () => {
    expect(parseIsoDate("2024-02-29")).not.toBeNull();
    expect(parseIsoDate("1900-02-29")).toBeNull();
    expect(parseIsoDate("2000-02-29")).not.toBeNull();
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 12)).toBe(31);
  });

  it("validates year bounds", () => {
    expect(isValidYmd({ year: 1000, month: 1, day: 1 })).toBe(true);
    expect(isValidYmd({ year: 999, month: 1, day: 1 })).toBe(false);
    expect(isValidYmd({ year: 10000, month: 1, day: 1 })).toBe(false);
  });
});

describe("comparison and ranges", () => {
  const a = { year: 2026, month: 10, day: 13 };
  const b = { year: 2026, month: 10, day: 14 };

  it("orders dates", () => {
    expect(compareYmd(a, b)).toBeLessThan(0);
    expect(compareYmd(b, a)).toBeGreaterThan(0);
    expect(compareYmd(a, { ...a })).toBe(0);
    expect(compareYmd({ year: 2025, month: 12, day: 31 }, { year: 2026, month: 1, day: 1 })).toBeLessThan(0);
  });

  it("checks inclusive bounds, either of which may be missing", () => {
    expect(isWithinRange(a, null, null)).toBe(true);
    expect(isWithinRange(a, null, a)).toBe(true);
    expect(isWithinRange(b, null, a)).toBe(false);
    expect(isWithinRange(a, a, null)).toBe(true);
    expect(isWithinRange(a, b, null)).toBe(false);
    expect(isWithinRange(a, a, b)).toBe(true);
  });
});

describe("weekdays and month navigation", () => {
  it("counts weekdays from Monday", () => {
    expect(weekdayMondayFirst({ year: 2026, month: 10, day: 12 })).toBe(0); // понедельник
    expect(weekdayMondayFirst({ year: 2026, month: 10, day: 14 })).toBe(2); // среда
    expect(weekdayMondayFirst({ year: 2026, month: 10, day: 18 })).toBe(6); // воскресенье
    expect(weekdayMondayFirst({ year: 2000, month: 1, day: 1 })).toBe(5); // суббота
  });

  it("moves across year boundaries in both directions", () => {
    expect(addMonths(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(addMonths(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(addMonths(2026, 3, 25)).toEqual({ year: 2028, month: 4 });
    expect(addMonths(2026, 3, -15)).toEqual({ year: 2024, month: 12 });
    expect(addMonths(2026, 5, 0)).toEqual({ year: 2026, month: 5 });
  });
});

describe("buildMonthGrid", () => {
  it("always has 6 weeks of 7 days starting on Monday", () => {
    for (const [year, month] of [[2026, 10], [2026, 2], [2024, 2], [2026, 6], [2000, 1]] as const) {
      const grid = buildMonthGrid(year, month);
      expect(grid).toHaveLength(42);
      expect(weekdayMondayFirst(grid[0].date)).toBe(0);
    }
  });

  it("October 2026 starts on a Thursday, with the previous month filling the front", () => {
    const grid = buildMonthGrid(2026, 10);
    expect(grid[0].date).toEqual({ year: 2026, month: 9, day: 28 });
    expect(grid[0].inMonth).toBe(false);
    expect(grid[3].date).toEqual({ year: 2026, month: 10, day: 1 });
    expect(grid[3].inMonth).toBe(true);
    expect(grid.filter((cell) => cell.inMonth)).toHaveLength(31);
    expect(grid[41].date).toEqual({ year: 2026, month: 11, day: 8 });
  });

  it("handles January (previous month is the previous year) and December", () => {
    expect(buildMonthGrid(2026, 1)[0].date.year).toBeLessThanOrEqual(2026);
    expect(buildMonthGrid(2026, 1).some((cell) => cell.date.year === 2025)).toBe(true);
    expect(buildMonthGrid(2026, 12).some((cell) => cell.date.year === 2027)).toBe(true);
  });

  it("has consecutive days with no gaps or repeats", () => {
    const grid = buildMonthGrid(2024, 2);
    for (let i = 1; i < grid.length; i++) {
      const previous = grid[i - 1].date;
      const current = grid[i].date;
      const sameMonth = previous.year === current.year && previous.month === current.month;
      if (sameMonth) expect(current.day).toBe(previous.day + 1);
      else expect(current.day).toBe(1);
    }
  });
});

describe("display and typing", () => {
  it("formats by locale and returns empty for no value", () => {
    expect(formatDisplayDate("1990-05-15", "ru")).toBe("15.05.1990");
    expect(formatDisplayDate("1990-05-15", "en")).toBe("15/05/1990");
    expect(formatDisplayDate("", "ru")).toBe("");
    expect(formatDisplayDate("nonsense", "en")).toBe("");
  });

  it("masks typing: digits only, separators appear by themselves, at most 8 digits", () => {
    expect(maskTypedDate("1", "ru")).toBe("1");
    expect(maskTypedDate("15", "ru")).toBe("15.");
    expect(maskTypedDate("150", "ru")).toBe("15.0");
    expect(maskTypedDate("1505", "ru")).toBe("15.05.");
    expect(maskTypedDate("15051990", "ru")).toBe("15.05.1990");
    expect(maskTypedDate("15.05.1990123", "ru")).toBe("15.05.1990");
    expect(maskTypedDate("15/05/1990", "en")).toBe("15/05/1990");
    expect(maskTypedDate("ab1c5", "en")).toBe("15/");
    expect(maskTypedDate("", "ru")).toBe("");
  });

  it("parses only a complete, existing date", () => {
    expect(parseTypedDate("15.05.1990")).toBe("1990-05-15");
    expect(parseTypedDate("15/05/1990")).toBe("1990-05-15");
    expect(parseTypedDate("29.02.2024")).toBe("2024-02-29");
    expect(parseTypedDate("29.02.2025")).toBeNull();
    expect(parseTypedDate("31.04.2026")).toBeNull();
    expect(parseTypedDate("15.05.199")).toBeNull();
    expect(parseTypedDate("")).toBeNull();
    expect(parseTypedDate("00.05.1990")).toBeNull();
    expect(parseTypedDate("15.13.1990")).toBeNull();
    expect(parseTypedDate("15.05.0990")).toBeNull();
  });
});
