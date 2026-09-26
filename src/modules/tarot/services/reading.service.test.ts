import { describe, expect, it } from "vitest";
import { requireSpreadById } from "../domain/spreads.data";
import { drawForSpread } from "./draw-engine";
import { reconstructDrawnCards, toReadingCardRecords } from "./reading.service";

describe("reading.service", () => {
  it("reconstructs an identical reading from its stored records", () => {
    const spread = requireSpreadById("five-card");
    const original = drawForSpread(spread, { seed: "reconstruct-me" });
    const records = toReadingCardRecords(original);

    const reconstructed = reconstructDrawnCards(spread, records);

    expect(reconstructed.map((drawn) => drawn.card.id)).toEqual(original.cards.map((drawn) => drawn.card.id));
    expect(reconstructed.map((drawn) => drawn.orientation)).toEqual(original.cards.map((drawn) => drawn.orientation));
    expect(reconstructed.map((drawn) => drawn.position.id)).toEqual(original.cards.map((drawn) => drawn.position.id));
  });

  it("reconstructs in position order regardless of record order", () => {
    const spread = requireSpreadById("three-card");
    const original = drawForSpread(spread, { seed: "order-check" });
    const records = [...toReadingCardRecords(original)].reverse();

    const reconstructed = reconstructDrawnCards(spread, records);

    expect(reconstructed.map((drawn) => drawn.position.id)).toEqual(["past", "present", "future"]);
  });

  it("throws for a record referencing a position that doesn't belong to the spread", () => {
    const spread = requireSpreadById("one-card");
    expect(() =>
      reconstructDrawnCards(spread, [{ cardId: "the-fool", positionId: "not-a-position", orientation: "upright", order: 0 }]),
    ).toThrow();
  });
});
