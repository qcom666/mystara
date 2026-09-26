import { describe, expect, it } from "vitest";
import { getSectMercuryNote, localizeSectProfile, SECT_PROFILES } from "./sect.data";
import { getAllZodiacSigns, localizeZodiacSign } from "./zodiac-signs.data";

const CYRILLIC = /[А-Яа-яЁё]/;

describe("zodiac content (Russian)", () => {
  it("translates every field of all 12 signs, matching the English list lengths", () => {
    const signs = getAllZodiacSigns();
    expect(signs).toHaveLength(12);
    for (const base of signs) {
      const ru = localizeZodiacSign(base, "ru");
      expect(ru.name, base.id).toMatch(CYRILLIC);
      expect(ru.rulingPlanet, base.id).toMatch(CYRILLIC);
      expect(ru.description, base.id).toMatch(CYRILLIC);
      expect(ru.keywords).toHaveLength(base.keywords.length);
      expect(ru.strengths).toHaveLength(base.strengths.length);
      expect(ru.challenges).toHaveLength(base.challenges.length);
      for (const text of [...ru.keywords, ...ru.strengths, ...ru.challenges]) expect(text, base.id).toMatch(CYRILLIC);
    }
  });

  it("keeps language-independent fields (id, symbol, element, modality, dates) unchanged", () => {
    for (const base of getAllZodiacSigns()) {
      const ru = localizeZodiacSign(base, "ru");
      expect(ru.id).toBe(base.id);
      expect(ru.symbol).toBe(base.symbol);
      expect(ru.element).toBe(base.element);
      expect(ru.modality).toBe(base.modality);
      expect(ru.dateRange).toEqual(base.dateRange);
    }
  });

  it("returns the very same object for English", () => {
    const [first] = getAllZodiacSigns();
    expect(localizeZodiacSign(first, "en")).toBe(first);
  });
});

describe("sect content (Russian)", () => {
  it("translates both profiles and the Mercury note", () => {
    for (const profile of Object.values(SECT_PROFILES)) {
      const ru = localizeSectProfile(profile, "ru");
      expect(ru.title).toMatch(CYRILLIC);
      expect(ru.description).toMatch(CYRILLIC);
      expect(ru.keynote).toMatch(CYRILLIC);
      // Planet names are English ids here; the UI maps them through the dictionary.
      expect(ru.favoredPlanets).toEqual(profile.favoredPlanets);
    }
    expect(getSectMercuryNote("ru")).toMatch(CYRILLIC);
    expect(getSectMercuryNote("en")).not.toMatch(CYRILLIC);
  });

  it("avoids the loanword 'секта', which reads as 'cult' in Russian", () => {
    for (const profile of Object.values(SECT_PROFILES)) {
      const ru = localizeSectProfile(profile, "ru");
      expect(`${ru.title} ${ru.description} ${ru.keynote}`.toLowerCase()).not.toContain("секта");
    }
  });
});
