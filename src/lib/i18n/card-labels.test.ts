import { describe, expect, it } from "vitest";
import { FULL_DECK } from "@/modules/tarot/domain/deck";
import { getDictionary } from "./dictionaries";

const CYRILLIC = /[А-Яа-яЁё]/;

describe("card labels in the interface dictionaries", () => {
  const suits = [...new Set(FULL_DECK.map((card) => card.suit).filter((suit) => suit !== null))].sort();
  const leanings = [...new Set(FULL_DECK.map((card) => card.meanings.yesNo))].sort();

  for (const locale of ["en", "ru"] as const) {
    const { reading } = getDictionary(locale);

    it(`names every suit in the ${locale} dictionary`, () => {
      expect(Object.keys(reading.suits).sort()).toEqual(suits);
      for (const label of Object.values(reading.suits)) {
        expect(label.length).toBeGreaterThan(0);
        expect(CYRILLIC.test(label)).toBe(locale === "ru");
      }
    });

    it(`has a yes/no answer in the ${locale} dictionary for every leaning used in the deck`, () => {
      const answers = reading.yesNoAnswers as Record<string, string>;
      for (const leaning of leanings) {
        expect(answers[leaning], leaning).toBeTruthy();
        expect(CYRILLIC.test(answers[leaning]), leaning).toBe(locale === "ru");
      }
    });
  }

  it("shows the suit names in Russian as the standard Russian suit names", () => {
    expect(getDictionary("ru").reading.suits).toEqual({ wands: "Жезлы", cups: "Кубки", swords: "Мечи", pentacles: "Пентакли" });
  });
});
