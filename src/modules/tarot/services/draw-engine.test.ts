import { describe, expect, it } from "vitest";
import { requireSpreadById } from "../domain/spreads.data";
import { drawForSpread } from "./draw-engine";

describe("draw-engine", () => {
  it("draws exactly cardCount cards for a spread", () => {
    const spread = requireSpreadById("celtic-cross");
    const result = drawForSpread(spread, { seed: "test-seed-1" });
    expect(result.cards).toHaveLength(10);
  });

  it("never draws duplicate cards within a single reading", () => {
    const spread = requireSpreadById("celtic-cross");
    for (let i = 0; i < 20; i++) {
      const result = drawForSpread(spread, { seed: `dup-check-${i}` });
      const ids = result.cards.map((drawn) => drawn.card.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("is reproducible: the same seed produces the same shuffle and orientations", () => {
    const spread = requireSpreadById("three-card");
    const a = drawForSpread(spread, { seed: "reproducible-seed" });
    const b = drawForSpread(spread, { seed: "reproducible-seed" });
    expect(a.cards.map((drawn) => drawn.card.id)).toEqual(b.cards.map((drawn) => drawn.card.id));
    expect(a.cards.map((drawn) => drawn.orientation)).toEqual(b.cards.map((drawn) => drawn.orientation));
  });

  it("produces a different shuffle for a different seed", () => {
    const spread = requireSpreadById("celtic-cross");
    const a = drawForSpread(spread, { seed: "seed-a" });
    const b = drawForSpread(spread, { seed: "seed-b" });
    expect(a.cards.map((drawn) => drawn.card.id)).not.toEqual(b.cards.map((drawn) => drawn.card.id));
  });

  it("produces both orientations across many draws", () => {
    const spread = requireSpreadById("one-card");
    const orientations = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const result = drawForSpread(spread, { seed: `orientation-${i}` });
      orientations.add(result.cards[0].orientation);
    }
    expect(orientations.has("upright")).toBe(true);
    expect(orientations.has("reversed")).toBe(true);
  });

  it("assigns positions in the spread's defined order", () => {
    const spread = requireSpreadById("three-card");
    const result = drawForSpread(spread, { seed: "position-order" });
    expect(result.cards.map((drawn) => drawn.position.id)).toEqual(["past", "present", "future"]);
  });

  it("throws if the spread needs more cards than the deck has", () => {
    const spread = requireSpreadById("one-card");
    expect(() => drawForSpread({ ...spread, cardCount: 999 }, { seed: "x" })).toThrow();
  });
});
