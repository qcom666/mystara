import { describe, expect, it } from "vitest";
import { OFFER_SECTIONS } from "./offer";
import { OFFER_VERSION, OPERATOR } from "./operator";
import type { LegalBlock } from "./privacy-policy";

function flatten(blocks: LegalBlock[]): string[] {
  return blocks.flatMap((block) => (typeof block === "string" ? [block] : block));
}

const russianText = flatten(OFFER_SECTIONS.flatMap((section) => section.body.ru)).join("\n");
const englishText = flatten(OFFER_SECTIONS.flatMap((section) => section.body.en)).join("\n");

describe("public offer content", () => {
  it("covers what a consumer offer for digital services has to cover", () => {
    const ids = OFFER_SECTIONS.map((section) => section.id);
    for (const required of ["subject", "acceptance", "prices", "delivery", "refunds", "claims", "personal-data", "details"]) {
      expect(ids).toContain(required);
    }
    for (const phrase of ["437", "438", "2300-1", "10 дней", "Мой налог", "18 лет"]) expect(russianText).toContain(phrase);
  });

  it("never offers or mentions paying with crypto-currency (259-FZ art. 14 forbids advertising it)", () => {
    for (const text of [russianText, englishText]) {
      expect(text).not.toMatch(/крипт|usdt|\bton\b|bitcoin|биткоин|blockchain|блокчейн|crypto/i);
    }
  });

  it("states the same prices the pricing modules and the site use", () => {
    expect(russianText).toContain("1000 ₽");
    expect(russianText).toContain("300 ₽");
    expect(russianText).toContain("333,33 ₽");
  });

  it("names the seller and has a date-shaped version", () => {
    expect(russianText).toContain(OPERATOR.name);
    expect(russianText).toContain(OPERATOR.registration);
    expect(OFFER_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
