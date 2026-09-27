import julian from "astronomia/julian";
import { describe, expect, it } from "vitest";
import { calculateSunSign } from "./calculate-sun-sign";
import { getBodyPositions } from "./ephemeris";

function jdeFor(year: number, month: number, day: number, hourUtc = 12): number {
  return julian.CalendarGregorianToJD(year, month, day + hourUtc / 24);
}

function angularDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

// The equinoxes/solstices are *defined* by the Sun's apparent geocentric
// ecliptic longitude — 0°/90°/180°/270° exactly at the instant. Using noon UTC
// on the calendar day the event usually falls on can be up to ~1 day (~1°)
// off the exact instant, so the tolerance below is generous on purpose: this
// test exists to catch a fundamentally broken calculation (a wrong century,
// swapped sign, wrong units), not to pin down the algorithm to arc-seconds.
describe("getBodyPositions — Sun against known equinox/solstice longitudes", () => {
  it.each([
    ["March equinox", 2024, 3, 20, 0],
    ["June solstice", 2024, 6, 21, 90],
    ["September equinox", 2024, 9, 22, 180],
    ["December solstice", 2024, 12, 21, 270],
  ] as const)("%s lands within 2° of %d°", (_label, year, month, day, expectedLon) => {
    const jde = jdeFor(year, month, day);
    const sun = getBodyPositions(jde).find((b) => b.id === "sun");
    expect(sun).toBeDefined();
    expect(angularDistance(sun!.longitudeDeg, expectedLon)).toBeLessThan(2);
  });
});

describe("getBodyPositions — Sun sign agrees with the simple calendar method", () => {
  // Dates picked comfortably away from a sign boundary, so a few days' worth
  // of "which exact instant is noon UTC" slack can never flip the sign.
  it.each([
    [2000, 1, 10, "capricorn"],
    [1995, 4, 25, "taurus"],
    [1990, 7, 10, "cancer"],
    [2010, 10, 10, "libra"],
    [1985, 11, 25, "sagittarius"],
  ] as const)("%s-%s-%s → %s", (year, month, day, expectedSignId) => {
    const jde = jdeFor(year, month, day);
    const sun = getBodyPositions(jde).find((b) => b.id === "sun")!;
    const signIndexFromEphemeris = Math.floor(sun.longitudeDeg / 30);

    const calendarSign = calculateSunSign(new Date(Date.UTC(year, month - 1, day, 12)));
    const zodiacOrder = [
      "aries",
      "taurus",
      "gemini",
      "cancer",
      "leo",
      "virgo",
      "libra",
      "scorpio",
      "sagittarius",
      "capricorn",
      "aquarius",
      "pisces",
    ];

    expect(zodiacOrder[signIndexFromEphemeris]).toBe(expectedSignId);
    expect(zodiacOrder[signIndexFromEphemeris]).toBe(calendarSign.id);
  });
});

describe("getBodyPositions — general sanity", () => {
  const jde = jdeFor(1990, 5, 14);
  const positions = getBodyPositions(jde);

  it("returns one entry per body (Pluto included — 1990 is in its valid range)", () => {
    expect(positions.map((p) => p.id).sort()).toEqual(
      ["jupiter", "mars", "mercury", "moon", "neptune", "pluto", "saturn", "sun", "uranus", "venus"].sort(),
    );
  });

  it("every longitude is a finite number in [0, 360)", () => {
    for (const p of positions) {
      expect(Number.isFinite(p.longitudeDeg)).toBe(true);
      expect(p.longitudeDeg).toBeGreaterThanOrEqual(0);
      expect(p.longitudeDeg).toBeLessThan(360);
    }
  });

  it("marks retrograde only as a real tri-state for planets, never for the luminaries", () => {
    const sun = positions.find((p) => p.id === "sun")!;
    const moon = positions.find((p) => p.id === "moon")!;
    const mars = positions.find((p) => p.id === "mars")!;
    expect(sun.isRetrograde).toBeNull();
    expect(moon.isRetrograde).toBeNull();
    expect(typeof mars.isRetrograde).toBe("boolean");
  });

  it("omits Pluto outside its series' valid range instead of guessing", () => {
    const tooEarly = getBodyPositions(jdeFor(1700, 1, 1));
    expect(tooEarly.find((p) => p.id === "pluto")).toBeUndefined();
  });
});
