import julian from "astronomia/julian";
import sidereal from "astronomia/sidereal";
import { describe, expect, it } from "vitest";
import { calculateChartAngles } from "./chart-angles";

function jdUtFor(year: number, month: number, day: number, hourUtc: number): number {
  return julian.CalendarGregorianToJD(year, month, day + hourUtc / 24);
}

/** Долгота (на восток положительная), при которой RAMC в этот момент ровно 0°. */
function longitudeForZeroRamc(jdUt: number): number {
  const gstDeg = sidereal.apparent(jdUt) / 240;
  return (((-gstDeg) % 360) + 360) % 360;
}

describe("calculateChartAngles — textbook degenerate case (equator, RAMC = 0°)", () => {
  // Без наклона эклиптики восходящая точка была бы ровно в 90° от меридиана; при реальном наклоне (~23,4°)
  // формулы всё равно должны давать известные учебные значения на экваторе, когда точка весеннего
  // равноденствия (RAMC 0°) на меридиане: MC = 0° Овна, асцендент = 90° (0° Рака).
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
    // ~2,5° за 10 минут на экваторе; наклон и широта искажают это значение, поэтому проверка лишь
    // убеждается, что движение идёт вперёд с правдоподобной скоростью, а не с точной.
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
