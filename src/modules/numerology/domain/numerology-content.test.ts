import { describe, expect, it } from "vitest";
import { getLifePathMeaning, LIFE_PATH_MEANINGS } from "./life-path-meanings.data";
import { describeNumberForType, getNumberTypeLabels, NUMBER_TYPE_INFO } from "./number-type-framing";
import type { LifePathNumber, NumerologyNumberType } from "./types";

const CYRILLIC = /[А-Яа-яЁё]/;
const NUMBERS = Object.keys(LIFE_PATH_MEANINGS).map(Number) as LifePathNumber[];
const TYPES = Object.keys(NUMBER_TYPE_INFO) as NumerologyNumberType[];

describe("Life Path content (Russian)", () => {
  it("translates every field of every number, matching the English list lengths", () => {
    for (const number of NUMBERS) {
      const en = getLifePathMeaning(number, "en");
      const ru = getLifePathMeaning(number, "ru");
      expect(ru.number).toBe(en.number);
      expect(ru.title).toMatch(CYRILLIC);
      expect(ru.description).toMatch(CYRILLIC);
      expect(ru.keywords).toHaveLength(en.keywords.length);
      expect(ru.strengths).toHaveLength(en.strengths.length);
      expect(ru.challenges).toHaveLength(en.challenges.length);
      for (const text of [...ru.keywords, ...ru.strengths, ...ru.challenges]) expect(text).toMatch(CYRILLIC);
    }
  });

  it("defaults to English", () => {
    expect(getLifePathMeaning(5).title).toBe("The Free Spirit");
    expect(getLifePathMeaning(5, "ru").title).toBe("Свободный дух");
  });
});

describe("number-type framing", () => {
  it("has a Russian label and subtitle for every number type", () => {
    for (const type of TYPES) {
      const { label, subtitle } = getNumberTypeLabels(type, "ru");
      expect(label).toMatch(CYRILLIC);
      expect(subtitle).toMatch(CYRILLIC);
    }
  });

  it("composes a Cyrillic-only sentence for every number × type, quoting rather than declining keywords", () => {
    for (const number of NUMBERS) {
      for (const type of TYPES) {
        const text = describeNumberForType(number, type, "ru");
        expect(text, `${number}/${type}`).toMatch(CYRILLIC);
        expect(text, `${number}/${type}`).not.toMatch(/[A-Za-z]|undefined/);
        if (type !== "lifePath") expect(text).toContain("«");
      }
    }
  });

  it("leaves the English output unchanged", () => {
    expect(describeNumberForType(3, "birthday")).toBe(
      "A natural gift running through your life: expression and creativity, in the spirit of Communicator.",
    );
  });
});
