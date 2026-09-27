import { describe, expect, it } from "vitest";
import { createAstrologyReadingSchema, createNumerologyReadingSchema } from "./numerology-astrology.schema";

const profile = { expressionNumber: 1, soulUrgeNumber: 6, personalityNumber: 4, maturityNumber: 3 } as const;

describe("createNumerologyReadingSchema", () => {
  const base = { birthDate: "1990-05-14", lifePathNumber: 11, birthdayNumber: 5 };

  it("accepts the minimal payload — no name, no per-system numbers", () => {
    expect(createNumerologyReadingSchema.safeParse(base).success).toBe(true);
  });

  it("accepts the full payload — a name plus both systems' numbers", () => {
    const result = createNumerologyReadingSchema.safeParse({ ...base, fullName: "Иван Петров", pythagorean: profile, chaldean: profile });
    expect(result.success).toBe(true);
  });

  it("accepts fullName/pythagorean/chaldean explicitly set to null (no calculable name)", () => {
    expect(createNumerologyReadingSchema.safeParse({ ...base, fullName: null, pythagorean: null, chaldean: null }).success).toBe(true);
  });

  it("rejects a number outside the valid Life-Path/Expression/etc. set", () => {
    expect(createNumerologyReadingSchema.safeParse({ ...base, lifePathNumber: 10 }).success).toBe(false);
    expect(createNumerologyReadingSchema.safeParse({ ...base, birthdayNumber: 0 }).success).toBe(false);
    expect(createNumerologyReadingSchema.safeParse({ ...base, pythagorean: { ...profile, maturityNumber: 13 } }).success).toBe(false);
  });

  it("rejects an empty-string name rather than silently treating it as \"no name\"", () => {
    expect(createNumerologyReadingSchema.safeParse({ ...base, fullName: "" }).success).toBe(false);
  });
});

describe("createAstrologyReadingSchema", () => {
  const base = { birthDate: "1996-09-01", sunSign: "virgo" };

  it("accepts no sect (guest didn't say, or picked \"Not sure\")", () => {
    expect(createAstrologyReadingSchema.safeParse(base).success).toBe(true);
    expect(createAstrologyReadingSchema.safeParse({ ...base, sect: null }).success).toBe(true);
  });

  it("accepts a known sect", () => {
    expect(createAstrologyReadingSchema.safeParse({ ...base, sect: "day" }).success).toBe(true);
    expect(createAstrologyReadingSchema.safeParse({ ...base, sect: "night" }).success).toBe(true);
  });

  it("rejects an unknown sect or sign", () => {
    expect(createAstrologyReadingSchema.safeParse({ ...base, sect: "dusk" }).success).toBe(false);
    expect(createAstrologyReadingSchema.safeParse({ ...base, sunSign: "ophiuchus" }).success).toBe(false);
  });
});
