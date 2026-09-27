import { describe, expect, it } from "vitest";
import { describeAspect, describeChartRuler, describeHousePlacement, describePlacement } from "./natal-chart-interpretation";
import type { ChartAspect, PlanetPlacement } from "./types";

const placement: PlanetPlacement = { planet: "venus", longitudeDeg: 45, sign: "taurus", degreeInSign: 15, house: 11, isRetrograde: false };
const aspect: ChartAspect = { a: "sun", b: "moon", type: "trine", orb: 2.4 };

describe("natal chart interpretation composition", () => {
  it.each(["en", "ru"] as const)("describePlacement produces non-empty %s text naming the planet and sign", (locale) => {
    const text = describePlacement(placement, locale);
    expect(text.length).toBeGreaterThan(10);
    expect(text).toMatch(locale === "ru" ? /Венера/ : /Venus/);
    expect(text).toMatch(locale === "ru" ? /Телец/ : /Taurus/);
  });

  it.each(["en", "ru"] as const)("describeHousePlacement mentions the house number in %s", (locale) => {
    const text = describeHousePlacement(placement, locale);
    expect(text).not.toBeNull();
    expect(text).toMatch(/11/);
  });

  it("describeHousePlacement returns null when the house is unknown (no exact birth time)", () => {
    expect(describeHousePlacement({ ...placement, house: null }, "en")).toBeNull();
  });

  it.each([
    [1, "1st"],
    [2, "2nd"],
    [3, "3rd"],
    [4, "4th"],
    [11, "11th"],
    [12, "12th"],
  ])("formats the English ordinal for house %d as %s (houses only ever run 1–12)", (house, expected) => {
    const text = describeHousePlacement({ ...placement, house }, "en");
    expect(text).toContain(expected);
  });

  it.each(["en", "ru"] as const)("describeAspect names both bodies and the aspect type in %s", (locale) => {
    const text = describeAspect(aspect, locale);
    expect(text).toMatch(locale === "ru" ? /Солнце/ : /Sun/);
    expect(text).toMatch(locale === "ru" ? /Луна/ : /Moon/);
    expect(text).toMatch(locale === "ru" ? /Трин/i : /Trine/i);
  });

  it.each(["en", "ru"] as const)("describeChartRuler names the ruling planet in %s", (locale) => {
    const text = describeChartRuler("mars", "aries", locale);
    expect(text).toMatch(locale === "ru" ? /Марс/ : /Mars/);
  });
});
