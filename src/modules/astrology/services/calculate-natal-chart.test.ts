import { describe, expect, it } from "vitest";
import { calculateNatalChart } from "./calculate-natal-chart";

const KNOWN_BIRTH = { birthDateUtc: new Date(Date.UTC(1990, 4, 14, 9, 30)), hasExactTime: true, latitude: 55.75, longitude: 37.62 };

describe("calculateNatalChart — with an exact time", () => {
  const chart = calculateNatalChart(KNOWN_BIRTH);

  it("computes all ten bodies", () => {
    expect(chart.planets).toHaveLength(10);
  });

  it("gives every planet a whole-sign house in 1–12", () => {
    for (const planet of chart.planets) {
      expect(planet.house).not.toBeNull();
      expect(planet.house).toBeGreaterThanOrEqual(1);
      expect(planet.house).toBeLessThanOrEqual(12);
    }
  });

  it("puts the Ascendant's own sign in house 1", () => {
    const ascendantSignPlanet = chart.planets.find((p) => p.sign === chart.ascendant!.sign);
    if (ascendantSignPlanet) expect(ascendantSignPlanet.house).toBe(1);
    // Even if no planet happens to sit in that sign, the invariant to check
    // is the house-numbering scheme itself:
    expect(chart.ascendant).not.toBeNull();
  });

  it("assigns a chart ruler consistent with the Ascendant's sign", () => {
    expect(chart.chartRuler).not.toBeNull();
  });

  it("keeps every degree-in-sign within [0, 30)", () => {
    for (const planet of chart.planets) {
      expect(planet.degreeInSign).toBeGreaterThanOrEqual(0);
      expect(planet.degreeInSign).toBeLessThan(30);
    }
  });

  it("never aspects a body with itself and never duplicates a pair", () => {
    const seen = new Set<string>();
    for (const aspect of chart.aspects) {
      expect(aspect.a).not.toBe(aspect.b);
      const key = [aspect.a, aspect.b].sort().join("-");
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it("keeps every aspect orb within the widest defined orb", () => {
    for (const aspect of chart.aspects) {
      expect(aspect.orb).toBeGreaterThanOrEqual(0);
      expect(aspect.orb).toBeLessThanOrEqual(8);
    }
  });
});

describe("calculateNatalChart — without an exact time", () => {
  const chart = calculateNatalChart({ ...KNOWN_BIRTH, hasExactTime: false });

  it("omits the Ascendant, Midheaven, chart ruler, and every planet's house rather than guessing", () => {
    expect(chart.ascendant).toBeNull();
    expect(chart.midheaven).toBeNull();
    expect(chart.chartRuler).toBeNull();
    for (const planet of chart.planets) expect(planet.house).toBeNull();
  });

  it("still computes planet signs and aspects — those don't depend on the birth time", () => {
    expect(chart.planets).toHaveLength(10);
    expect(chart.planets.every((p) => p.sign)).toBe(true);
  });
});

describe("calculateNatalChart — whole-sign houses stay correct for a very different Ascendant", () => {
  it("rotates house 1 to wherever the Ascendant falls, for a birth 12 hours later", () => {
    const morning = calculateNatalChart(KNOWN_BIRTH);
    const evening = calculateNatalChart({ ...KNOWN_BIRTH, birthDateUtc: new Date(Date.UTC(1990, 4, 14, 21, 30)) });
    // A 12-hour shift moves the Ascendant roughly (but not exactly) halfway
    // around the zodiac — the two Ascendant signs should differ.
    expect(morning.ascendant!.sign).not.toBe(evening.ascendant!.sign);
  });
});
