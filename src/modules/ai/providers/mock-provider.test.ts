import { describe, expect, it } from "vitest";
import { requireSpreadById } from "@/modules/tarot/domain/spreads.data";
import { drawForSpread } from "@/modules/tarot/services/draw-engine";
import { MockAIProvider } from "./mock-provider";

describe("MockAIProvider", () => {
  it("returns one interpretation per drawn card", async () => {
    const spread = requireSpreadById("three-card");
    const { cards } = drawForSpread(spread, { seed: "mock-provider-test" });
    const provider = new MockAIProvider();

    const result = await provider.generate({ question: "Should I change my job?", spread, cards });

    expect(result.cardInterpretations).toHaveLength(cards.length);
    expect(result.provider).toBe("mock");
  });

  it("hedges language and never claims a guaranteed outcome", async () => {
    const spread = requireSpreadById("one-card");
    const { cards } = drawForSpread(spread, { seed: "hedged-language" });
    const provider = new MockAIProvider();

    const result = await provider.generate({ question: null, spread, cards });
    const overall = result.overall.toLowerCase();

    // The disclaimer itself legitimately contains the word "guaranteed" (as
    // a negation) — assert no *affirmative* guarantee language slips in.
    expect(overall).not.toMatch(/\b(is|are)\s+guaranteed\b|\bwill (definitely|certainly)\b/);
    expect(overall).toContain("not a guaranteed prediction");
  });

  describe("Russian locale", () => {
    const CYRILLIC = /[А-Яа-яЁё]/;
    // Names of the Latin-script suits/ranks that would betray a leaked English card name.
    const ENGLISH_CARD_WORDS = /\b(Wands|Cups|Swords|Pentacles|The Fool|The Sun|Ace of|Queen of|King of|Knight of|Page of)\b/;

    it("writes every field in Russian, with no English card or position names leaking through", async () => {
      const spread = requireSpreadById("five-card");
      const { cards } = drawForSpread(spread, { seed: "ru-locale" });
      const result = await new MockAIProvider().generate({ question: null, spread, cards, locale: "ru" });

      const allText = [result.summary, result.overall, ...result.advice, ...result.challenges, ...result.themes, ...result.cardInterpretations.map((c) => c.interpretation)].join(" ");
      expect(allText).toMatch(CYRILLIC);
      expect(allText).not.toMatch(ENGLISH_CARD_WORDS);
      // Themes come from the Russian keywords, so none should be Latin-script.
      for (const theme of result.themes) expect(theme).toMatch(CYRILLIC);
      expect(result.overall).toContain("не гарантированное предсказание");
    });

    it("quotes the user's question and picks the matching focus from Russian keywords", async () => {
      const spread = requireSpreadById("one-card");
      const { cards } = drawForSpread(spread, { seed: "ru-focus" });
      const provider = new MockAIProvider();

      const love = await provider.generate({ question: "Как сложатся мои отношения?", spread, cards, locale: "ru" });
      const general = await provider.generate({ question: "Что мне делать?", spread, cards, locale: "ru" });

      expect(love.overall).toContain("«Как сложатся мои отношения?»");
      // A love-flavoured question appends the card's love meaning; a generic one appends the spiritual meaning.
      expect(love.cardInterpretations[0].interpretation).not.toEqual(general.cardInterpretations[0].interpretation);
    });

    it("defaults to English when no locale is given", async () => {
      const spread = requireSpreadById("one-card");
      const { cards } = drawForSpread(spread, { seed: "default-locale" });
      const result = await new MockAIProvider().generate({ question: null, spread, cards });
      expect(result.overall).not.toMatch(CYRILLIC);
    });
  });

  it("handles a reading with no question", async () => {
    const spread = requireSpreadById("five-card");
    const { cards } = drawForSpread(spread, { seed: "no-question" });
    const provider = new MockAIProvider();

    await expect(provider.generate({ question: null, spread, cards })).resolves.toBeDefined();
  });
});
