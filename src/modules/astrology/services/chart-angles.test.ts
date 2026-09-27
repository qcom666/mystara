import julian from "astronomia/julian";
import sidereal from "astronomia/sidereal";
import { describe, expect, it } from "vitest";
import { calculateChartAngles } from "./chart-angles";

function jdUtFor(year: number, month: number, day: number, hourUtc: number): number {
  return julian.CalendarGregorianToJD(year, month, day + hourUtc / 24);
}

/** The longitude (east-positive) that makes RAMC exactly 0° for this instant. */
function longitudeForZeroRamc(jdUt: number): number {
  const gstDeg = sidereal.apparent(jdUt) / 240;
  return (((-gstDeg) % 360) + 360) % 360;
}

describe("calculateChartAngles — textbook degenerate case (equator, RAMC = 0°)", () => {
  // With no ecliptic tilt the rising point would be exactly 90° from the
  // meridian; with real obliquity (~23.4°) the formulas should still reduce
  // to the well-known textbook values at the equator when the vernal-equinox
  // point (RAMC 0°) is on the meridian: MC = 0° Aries, Ascendant = 90° (0° Cancer).
  const jdUt = jdUtFor(2024, 6, 1, 0);
  const longitudeDeg = longitudeForZeroRamc(jdUt);
  const { ascendantDeg, midheavenDeg } = calculateChartAngles(jdUt, 0, longitudeDeg);

  it("puts the Midheaven at 0°", () => {
    expect(midheavenDeg).toBeCloseTo(0, 1);
  });

  it("puts the Ascendant at 90°", () => {
    expect(ascendantDeg).toBeCloseTo(90, 1);
  });
});

describe("calculateChartAngles — sensitivity to birth time", () => {
  it("moves the Ascendant by roughly a degree every four minutes of birth time", () => {
    const base = jdUtFor(1990, 5, 14, 12);
    const tenMinutesLater = base + 10 / (24 * 60);
    const a1 = calculateChartAngles(base, 45, 20).ascendantDeg;
    const a2 = calculateChartAngles(tenMinutesLater, 45, 20).ascendantDeg;
    let delta = a2 - a1;
    if (delta < -180) delta += 360;
    if (delta > 180) delta -= 360;
    // ~2.5° for 10 minutes at the equator; obliquity/latitude distort this,
    // so the assertion just checks it's moving forward at a plausible rate,
    // not the exact rate.
    expect(delta).toBeGreaterThan(0.5);
    expect(delta).toBeLessThan(6);
  });

  it("returns different Ascendants for different latitudes at the same instant", () => {
    const jdUt = jdUtFor(1990, 5, 14, 12);
    const atNorth = calculateChartAngles(jdUt, 55, 37).ascendantDeg;
    const atSouth = calculateChartAngles(jdUt, -33, 37).ascendantDeg;
    expect(atNorth).not.toBeCloseTo(atSouth, 0);
  });

  it("always returns values in [0, 360)", () => {
    const jdUt = jdUtFor(1975, 11, 3, 8);
    const { ascendantDeg, midheavenDeg } = calculateChartAngles(jdUt, -12, 151);
    for (const deg of [ascendantDeg, midheavenDeg]) {
      expect(deg).toBeGreaterThanOrEqual(0);
      expect(deg).toBeLessThan(360);
    }
  });
});
