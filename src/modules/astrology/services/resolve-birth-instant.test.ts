import { describe, expect, it } from "vitest";
import { resolveBirthInstantUtc } from "./resolve-birth-instant";

describe("resolveBirthInstantUtc", () => {
  it("converts Moscow local time to UTC using the offset that actually applied on that date", () => {
    // The USSR/Russia observed seasonal DST from 1981 to 2011 (and permanent
    // "summer time" 2011–2014) — Moscow was UTC+4 in May 1990, not today's
    // year-round UTC+3. This is exactly why resolveBirthInstantUtc takes an
    // IANA zone id instead of a fixed offset: luxon applies the *historical*
    // rule for the given date automatically.
    const utc = resolveBirthInstantUtc({ year: 1990, month: 5, day: 14, hour: 9, minute: 30, timezone: "Europe/Moscow" });
    expect(utc.toISOString()).toBe("1990-05-14T05:30:00.000Z");
  });

  it("converts a present-day Moscow time using the current year-round UTC+3", () => {
    const utc = resolveBirthInstantUtc({ year: 2024, month: 5, day: 14, hour: 9, minute: 30, timezone: "Europe/Moscow" });
    expect(utc.toISOString()).toBe("2024-05-14T06:30:00.000Z");
  });

  it("applies historical DST correctly for a summer date in a zone that observed it", () => {
    // New York in July observes EDT (UTC−4), historically as well as today.
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
