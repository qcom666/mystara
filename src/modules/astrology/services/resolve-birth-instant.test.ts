import { describe, expect, it } from "vitest";
import { resolveBirthInstantUtc } from "./resolve-birth-instant";

describe("resolveBirthInstantUtc", () => {
  it("converts Moscow local time to UTC using the offset that actually applied on that date", () => {
    // СССР и Россия применяли сезонный переход на летнее время с 1981 по 2011 год (а в 2011–2014 годах было
    // постоянное «летнее» время): в мае 1990 года в Москве было UTC+4, а не сегодняшнее круглогодичное UTC+3.
    // Именно поэтому resolveBirthInstantUtc принимает идентификатор пояса IANA, а не фиксированное смещение:
    // luxon сам применяет *историческое* правило для заданной даты.
    const utc = resolveBirthInstantUtc({ year: 1990, month: 5, day: 14, hour: 9, minute: 30, timezone: "Europe/Moscow" });
    expect(utc.toISOString()).toBe("1990-05-14T05:30:00.000Z");
  });

  it("converts a present-day Moscow time using the current year-round UTC+3", () => {
    const utc = resolveBirthInstantUtc({ year: 2024, month: 5, day: 14, hour: 9, minute: 30, timezone: "Europe/Moscow" });
    expect(utc.toISOString()).toBe("2024-05-14T06:30:00.000Z");
  });

  it("applies historical DST correctly for a summer date in a zone that observed it", () => {
    // Нью-Йорк в июле живёт по EDT (UTC−4), и сейчас, и исторически.
    const utc = resolveBirthInstantUtc({ year: 1985, month: 7, day: 4, hour: 12, minute: 0, timezone: "America/New_York" });
    expect(utc.toISOString()).toBe("1985-07-04T16:00:00.000Z");
  });

  it("defaults to local noon when no time is given (unknown birth time)", () => {
    const utc = resolveBirthInstantUtc({ year: 2000, month: 1, day: 1, timezone: "UTC" });
    expect(utc.toISOString()).toBe("2000-01-01T12:00:00.000Z");
  });

  it("throws for an invalid timezone rather than silently defaulting", () => {
    expect(() => resolveBirthInstantUtc({ year: 2000, month: 1, day: 1, timezone: "Not/AZone" })).toThrow();
  });
});
