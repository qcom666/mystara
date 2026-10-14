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

  describe("structure of the deck", () => {
    it("numbers the major arcana 0–21 without gaps and gives them no suit", () => {
      const major = FULL_DECK.filter((card) => card.arcana === "major");
      expect(major.map((card) => card.number).sort((a, b) => a - b)).toEqual(Array.from({ length: 22 }, (_, i) => i));
      for (const card of major) expect(card.suit, card.id).toBeNull();
    });

    it("gives each suit exactly the 14 cards numbered 1–14", () => {
      for (const suit of ["wands", "cups", "swords", "pentacles"] as const) {
        const numbers = FULL_DECK.filter((card) => card.suit === suit)
          .map((card) => card.number)
          .sort((a, b) => a - b);
        expect(numbers, suit).toEqual(Array.from({ length: 14 }, (_, i) => i + 1));
      }
    });

    it("keeps every card id a lowercase slug and every yes/no leaning a known value", () => {
      for (const card of FULL_DECK) {
        expect(card.id).toMatch(/^[a-z]+(-[a-z]+)*$/);
        expect(["yes", "no", "maybe", "yes-if-cautious"], card.id).toContain(card.meanings.yesNo);
      }
    });
  });

  describe("completeness of every card in both languages", () => {
    const TOPICS = ["upright", "reversed", "love", "career", "finance", "spiritual"] as const;
    const CYRILLIC = /[А-Яа-яЁё]/;
    const LATIN = /[A-Za-z]/;
    const SERVICE_JUNK = /undefined|\bnull\b|\bNaN\b|\$\{|\[object|TODO|FIXME/;

    // Каждый текст читается как законченное предложение: без пробелов по краям, двойных пробелов,
    // пробела перед знаком препинания, служебного мусора и с точкой (или другим знаком) в конце.
    function expectWellFormed(text: string, where: string) {
      expect(text.trim(), where).toBe(text);
      expect(text, where).not.toMatch(/\s{2,}|\s[,.;:!?]/);
      expect(text, where).not.toMatch(SERVICE_JUNK);
      expect(text, where).toMatch(/[.!?…»)]$/);
    }

    it("fills the description and all six topics in English and Russian with well-formed sentences", () => {
      for (const card of FULL_DECK) {
        expectWellFormed(card.description, `${card.id}.description`);
        expectWellFormed(card.descriptionRu, `${card.id}.descriptionRu`);
        expect(card.description, `${card.id}.description`).not.toMatch(CYRILLIC);
        expect(card.descriptionRu, `${card.id}.descriptionRu`).not.toMatch(LATIN);
        for (const topic of TOPICS) {
          expectWellFormed(card.meanings[topic], `${card.id}.meanings.${topic}`);
          expectWellFormed(card.meaningsRu[topic], `${card.id}.meaningsRu.${topic}`);
          expect(card.meanings[topic].length, `${card.id}.meanings.${topic}`).toBeGreaterThanOrEqual(25);
          expect(card.meaningsRu[topic].length, `${card.id}.meaningsRu.${topic}`).toBeGreaterThanOrEqual(25);
          expect(card.meanings[topic], `${card.id}.meanings.${topic}`).not.toMatch(CYRILLIC);
          expect(card.meaningsRu[topic], `${card.id}.meaningsRu.${topic}`).not.toMatch(LATIN);
        }
      }
    });

    it("never carries an untranslated copy of the English text into the Russian one", () => {
      for (const card of FULL_DECK) {
        expect(card.nameRu, card.id).not.toBe(card.name);
        expect(card.descriptionRu, card.id).not.toBe(card.description);
        for (const topic of TOPICS) expect(card.meaningsRu[topic], `${card.id}.${topic}`).not.toBe(card.meanings[topic]);
      }
    });

    it("gives every card at least three distinct keywords in each language", () => {
      for (const card of FULL_DECK) {
        expect(card.keywords.length, card.id).toBeGreaterThanOrEqual(3);
        expect(new Set(card.keywords).size, card.id).toBe(card.keywords.length);
        expect(new Set(card.keywordsRu).size, card.id).toBe(card.keywordsRu.length);
      }
    });

    it("gives all 78 cards different text for every topic, so no tab repeats across cards", () => {
      for (const topic of TOPICS) {
        const english = FULL_DECK.map((card) => card.meanings[topic]);
        const russian = FULL_DECK.map((card) => card.meaningsRu[topic]);
        expect(new Set(english).size, `meanings.${topic}`).toBe(FULL_DECK.length);
        expect(new Set(russian).size, `meaningsRu.${topic}`).toBe(FULL_DECK.length);
      }
      expect(new Set(FULL_DECK.map((card) => card.description)).size).toBe(FULL_DECK.length);
      expect(new Set(FULL_DECK.map((card) => card.descriptionRu)).size).toBe(FULL_DECK.length);
    });

    it("keeps the generated Minor Arcana descriptions grammatical: 'в сфере' + genitive, no stray accusative", () => {
      const aceOfWands = getCardById("ace-of-wands")!;
      expect(aceOfWands.descriptionRu).toBe("Карта «Туз Жезлов» раскрывает тему «новое начало» в сфере страсти, амбиций и творческого порыва.");
      const pageOfCups = getCardById("page-of-cups")!;
      expect(pageOfCups.descriptionRu).toBe("Карта «Паж Кубков» воплощает архетип любознательного ученика в сфере эмоций, любви и интуиции.");
    });
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
