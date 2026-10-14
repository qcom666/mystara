import { describe, expect, it } from "vitest";
import { getPositionLabel, getPositionMeaning, getSpreadById, getSpreadDescription, getSpreadName, SPREADS } from "./spreads.data";

describe("spreads", () => {
  it("gives every spread a positions array matching its cardCount", () => {
    for (const spread of SPREADS) {
      expect(spread.positions).toHaveLength(spread.cardCount);
    }
  });

  it("gives every spread unique, sequential position order values", () => {
    for (const spread of SPREADS) {
      const orders = spread.positions.map((position) => position.order).sort((a, b) => a - b);
      expect(orders).toEqual(Array.from({ length: spread.cardCount }, (_, i) => i + 1));
    }
  });

  it("gives every spread unique position ids", () => {
    for (const spread of SPREADS) {
      const ids = spread.positions.map((position) => position.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("gives every spread and position a Russian translation written in Cyrillic", () => {
    for (const spread of SPREADS) {
      expect(spread.nameRu, spread.id).toMatch(/[А-Яа-яЁё]/);
      expect(spread.descriptionRu, spread.id).toMatch(/[А-Яа-яЁё]/);
      for (const position of spread.positions) {
        expect(position.labelRu, `${spread.id}/${position.id}`).toMatch(/[А-Яа-яЁё]/);
        expect(position.meaningRu, `${spread.id}/${position.id}`).toMatch(/[А-Яа-яЁё]/);
      }
    }
  });

  it("keeps the Russian spread text free of untranslated Latin fragments and the English text free of Cyrillic", () => {
    for (const spread of SPREADS) {
      expect(spread.nameRu, spread.id).not.toMatch(/[A-Za-z]/);
      expect(spread.descriptionRu, spread.id).not.toMatch(/[A-Za-z]/);
      expect(spread.name, spread.id).not.toMatch(/[А-Яа-яЁё]/);
      expect(spread.description, spread.id).not.toMatch(/[А-Яа-яЁё]/);
      for (const position of spread.positions) {
        expect(position.labelRu, `${spread.id}/${position.id}`).not.toMatch(/[A-Za-z]/);
        expect(position.meaningRu, `${spread.id}/${position.id}`).not.toMatch(/[A-Za-z]/);
        expect(position.label, `${spread.id}/${position.id}`).not.toMatch(/[А-Яа-яЁё]/);
        expect(position.meaning, `${spread.id}/${position.id}`).not.toMatch(/[А-Яа-яЁё]/);
      }
    }
  });

  it("returns the English or Russian spread text depending on locale", () => {
    const spread = getSpreadById("three-card")!;
    expect(getSpreadName(spread, "en")).toBe("Three Card");
    expect(getSpreadName(spread, "ru")).toBe("Три карты");
    expect(getPositionLabel(spread.positions[0], "ru")).toBe("Прошлое");
    expect(getPositionMeaning(spread.positions[0], "en")).toBe("What led you here.");
    expect(getSpreadDescription(spread, "en")).toBe(spread.description);
  });

  it("resolves a spread by id", () => {
    expect(getSpreadById("celtic-cross")?.cardCount).toBe(10);
  });

  it("returns undefined for an unknown spread id", () => {
    expect(getSpreadById("not-a-real-spread")).toBeUndefined();
  });
});
