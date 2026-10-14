import { describe, expect, it } from "vitest";
import { getMajorArcana } from "@/modules/tarot/domain/deck";
import { hasMajorGlyph } from "./tarot-card-face";

describe("tarot card face", () => {
  it("draws a dedicated glyph for each of the 22 major arcana instead of the fallback", () => {
    const major = getMajorArcana();
    expect(major).toHaveLength(22);
    for (const card of major) expect(hasMajorGlyph(card.id), card.id).toBe(true);
  });

  it("has no glyph for a card that is not a major arcana", () => {
    expect(hasMajorGlyph("ace-of-cups")).toBe(false);
  });
});
