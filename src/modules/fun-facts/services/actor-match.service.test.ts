import { describe, expect, it } from "vitest";
import { calculateSunSign } from "@/modules/astrology/services/calculate-sun-sign";
import { calculateLifePathNumber } from "@/modules/numerology/services/calculate-life-path";
import { requireCardById } from "@/modules/tarot/domain/deck";
import { requireSpreadById } from "@/modules/tarot/domain/spreads.data";
import type { DrawnCard } from "@/modules/tarot/domain/types";
import { ACTORS } from "../domain/actors.data";
import { getActorFunFactByLifePath, getActorFunFactByReading, getActorFunFactByZodiac } from "./actor-match.service";

describe("getActorFunFactByZodiac", () => {
  it("only ever names an actor who actually shares that zodiac sign", () => {
    const fact = getActorFunFactByZodiac("leo", "seed-1");
    expect(fact).not.toBeNull();
    const actor = ACTORS.find((a) => a.name === fact?.actorName);
    expect(actor).toBeDefined();
    expect(calculateSunSign(new Date(actor!.birthDate)).id).toBe("leo");
  });

  it("is deterministic for the same seed", () => {
    const a = getActorFunFactByZodiac("scorpio", "same-seed");
    const b = getActorFunFactByZodiac("scorpio", "same-seed");
    expect(a).toEqual(b);
  });
});

describe("Russian fun facts", () => {
  const CYRILLIC = /[А-Яа-яЁё]/;

  it("names the actor in Cyrillic for every kind of fact", () => {
    const zodiac = getActorFunFactByZodiac("leo", "seed-ru", "ru")!;
    const lifePath = getActorFunFactByLifePath(5, "seed-ru", "ru")!;
    const tarot = getActorFunFactByReading(
      [{ card: requireCardById("the-magician"), orientation: "upright", position: requireSpreadById("one-card").positions[0] }],
      "seed-ru",
      "ru",
    )!;

    for (const fact of [zodiac, lifePath, tarot]) {
      expect(fact.actorName).toMatch(CYRILLIC);
      expect(fact.reason).toMatch(CYRILLIC);
      expect(fact.reason).toContain(fact.actorName);
    }
    expect(tarot.reason).toContain("«Маг»");
  });

  it("picks the same actor in both languages (only the wording changes)", () => {
    const en = getActorFunFactByZodiac("scorpio", "same", "en")!;
    const ru = getActorFunFactByZodiac("scorpio", "same", "ru")!;
    expect(ACTORS.find((a) => a.name === en.actorName)?.nameRu).toBe(ru.actorName);
  });
});

describe("getActorFunFactByLifePath", () => {
  it("only ever names an actor who actually shares that life path number", () => {
    const fact = getActorFunFactByLifePath(5, "seed-2");
    if (fact) {
      const actor = ACTORS.find((a) => a.name === fact.actorName);
      expect(actor).toBeDefined();
      expect(calculateLifePathNumber(new Date(actor!.birthDate))).toBe(5);
    }
  });

  it("handles every valid life path number without throwing, and every non-null result actually matches", () => {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33] as const;
    for (const number of numbers) {
      const fact = getActorFunFactByLifePath(number, `probe-${number}`);
      if (fact) {
        const actor = ACTORS.find((a) => a.name === fact.actorName);
        expect(calculateLifePathNumber(new Date(actor!.birthDate))).toBe(number);
      }
    }
  });
});

describe("getActorFunFactByReading", () => {
  it("returns a fact when a Major Arcana card was drawn", () => {
    const spread = requireSpreadById("one-card");
    const cards: DrawnCard[] = [{ card: requireCardById("the-fool"), orientation: "upright", position: spread.positions[0] }];
    const fact = getActorFunFactByReading(cards, "seed-3");
    expect(fact).not.toBeNull();
    expect(fact?.reason).toContain("The Fool");
  });

  it("returns null when no Major Arcana card was drawn", () => {
    const spread = requireSpreadById("one-card");
    const cards: DrawnCard[] = [{ card: requireCardById("ace-of-cups"), orientation: "upright", position: spread.positions[0] }];
    expect(getActorFunFactByReading(cards, "seed-4")).toBeNull();
  });
});
