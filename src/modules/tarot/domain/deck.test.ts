import { describe, expect, it } from "vitest";
import { FULL_DECK, getAllCards, getCardById, getCardDescription, getCardKeywords, getCardMeanings, getCardName } from "./deck";

describe("deck", () => {
  it("contains exactly 78 cards", () => {
    expect(getAllCards()).toHaveLength(78);
  });

  it("contains 22 major and 56 minor arcana", () => {
    const cards = getAllCards();
    expect(cards.filter((card) => card.arcana === "major")).toHaveLength(22);
    expect(cards.filter((card) => card.arcana === "minor")).toHaveLength(56);
  });

  it("has unique ids for every card", () => {
    const ids = FULL_DECK.map((card) => card.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every card a fully populated set of meanings", () => {
    for (const card of FULL_DECK) {
      expect(card.meanings.upright.length).toBeGreaterThan(0);
      expect(card.meanings.reversed.length).toBeGreaterThan(0);
      expect(card.meanings.love.length).toBeGreaterThan(0);
      expect(card.meanings.career.length).toBeGreaterThan(0);
      expect(card.meanings.finance.length).toBeGreaterThan(0);
      expect(card.meanings.spiritual.length).toBeGreaterThan(0);
      expect(card.keywords.length).toBeGreaterThan(0);
    }
  });

  describe("Russian localization", () => {
    it("gives every card a Russian name and description written in Cyrillic", () => {
      for (const card of FULL_DECK) {
        expect(card.nameRu, card.id).toMatch(/[А-Яа-яЁё]/);
        expect(card.descriptionRu, card.id).toMatch(/[А-Яа-яЁё]/);
        // Случайная латинская буква означала бы, что непереведённый фрагмент проскочил.
        expect(card.nameRu, card.id).not.toMatch(/[A-Za-z]/);
      }
    });

    it("gives every card Russian keywords and all six meanings, with no untranslated fragments", () => {
      for (const card of FULL_DECK) {
        expect(card.keywordsRu, card.id).toHaveLength(card.keywords.length);
        for (const keyword of card.keywordsRu) {
          expect(keyword, card.id).toMatch(/[А-Яа-яЁё]/);
          expect(keyword, card.id).not.toMatch(/[A-Za-z]/);
        }
        for (const [field, text] of Object.entries(card.meaningsRu)) {
          expect(text, `${card.id}.${field}`).toMatch(/[А-Яа-яЁё]/);
          expect(text, `${card.id}.${field}`).not.toMatch(/[A-Za-z]/);
        }
      }
    });

    it("never leaves a template placeholder or 'undefined' in generated Minor Arcana text", () => {
      for (const card of FULL_DECK.filter((c) => c.arcana === "minor")) {
        const text = [card.nameRu, card.descriptionRu, ...card.keywordsRu, ...Object.values(card.meaningsRu)].join(" ");
        expect(text, card.id).not.toMatch(/undefined|\$\{|\[object/);
      }
    });

    it("returns localized keywords and meanings, carrying yesNo over unchanged", () => {
      const fool = getCardById("the-fool")!;
      expect(getCardKeywords(fool, "en")).toEqual(fool.keywords);
      expect(getCardKeywords(fool, "ru")).toEqual(fool.keywordsRu);
      expect(getCardMeanings(fool, "en")).toBe(fool.meanings);
      expect(getCardMeanings(fool, "ru").upright).toBe(fool.meaningsRu.upright);
      expect(getCardMeanings(fool, "ru").yesNo).toBe(fool.meanings.yesNo);
    });

    it("keeps every Russian card name unique", () => {
      const names = FULL_DECK.map((card) => card.nameRu);
      expect(new Set(names).size).toBe(names.length);
    });

    it("uses the standard Russian names for well-known cards", () => {
      expect(getCardById("the-fool")?.nameRu).toBe("Шут");
      expect(getCardById("the-high-priestess")?.nameRu).toBe("Верховная Жрица");
      expect(getCardById("wheel-of-fortune")?.nameRu).toBe("Колесо Фортуны");
    });

    it("composes minor arcana names as '<rank> <suit in genitive plural>'", () => {
      expect(getCardById("three-of-wands")?.nameRu).toBe("Тройка Жезлов");
      expect(getCardById("ace-of-cups")?.nameRu).toBe("Туз Кубков");
      expect(getCardById("king-of-swords")?.nameRu).toBe("Король Мечей");
      expect(getCardById("page-of-pentacles")?.nameRu).toBe("Паж Пентаклей");
    });

    it("returns the English or Russian text depending on locale", () => {
      const fool = getCardById("the-fool")!;
      expect(getCardName(fool, "en")).toBe("The Fool");
      expect(getCardName(fool, "ru")).toBe("Шут");
      expect(getCardDescription(fool, "en")).toBe(fool.description);
      expect(getCardDescription(fool, "ru")).toBe(fool.descriptionRu);
    });
  });

  it("resolves a known card by id", () => {
    expect(getCardById("the-fool")?.name).toBe("The Fool");
  });

  it("returns undefined for an unknown id", () => {
    expect(getCardById("not-a-real-card")).toBeUndefined();
  });
});
