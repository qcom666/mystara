import { describe, expect, it } from "vitest";
import { CONSENT_SECTIONS } from "./consent";
import { OFFER_SECTIONS } from "./offer";
import { hasUnfilledOperatorDetails, OPERATOR, PRIVACY_POLICY_VERSION } from "./operator";
import { PRIVACY_POLICY_SECTIONS, type LegalBlock, type LegalSection } from "./privacy-policy";

const DOCUMENTS: [string, LegalSection[]][] = [
  ["privacy policy", PRIVACY_POLICY_SECTIONS],
  ["consent", CONSENT_SECTIONS],
  ["public offer", OFFER_SECTIONS],
];

function flatten(blocks: LegalBlock[]): string[] {
  return blocks.flatMap((block) => (typeof block === "string" ? [block] : block));
}

describe.each(DOCUMENTS)("%s", (_name, sections) => {
  it("has unique, url-safe section ids", () => {
    const ids = sections.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z-]+$/);
  });

  it("has a non-empty title and body in both languages for every section", () => {
    for (const section of sections) {
      for (const lang of ["ru", "en"] as const) {
        expect(section.title[lang].trim(), `${section.id} title ${lang}`).not.toBe("");
        const text = flatten(section.body[lang]);
        expect(text.length, `${section.id} body ${lang}`).toBeGreaterThan(0);
        for (const paragraph of text) expect(paragraph.trim(), `${section.id} ${lang}`).not.toBe("");
      }
    }
  });

  it("keeps the two languages structurally in step (same number of blocks, same block kinds)", () => {
    for (const section of sections) {
      const { ru, en } = section.body;
      expect(en.length, section.id).toBe(ru.length);
      ru.forEach((block, index) => {
        expect(Array.isArray(en[index]), `${section.id}[${index}] kind`).toBe(Array.isArray(block));
        if (Array.isArray(block) && Array.isArray(en[index])) expect(en[index].length, `${section.id}[${index}] items`).toBe(block.length);
      });
    }
  });

  it("writes the Russian text in Russian and the English text without Cyrillic prose", () => {
    for (const section of sections) {
      expect(section.title.ru, section.id).toMatch(/[А-Яа-яЁё]/);
      expect(section.title.en, section.id).not.toMatch(/[А-Яа-яЁё]/);
    }
  });
});

describe("privacy policy content", () => {
  const russianText = flatten(PRIVACY_POLICY_SECTIONS.flatMap((section) => section.body.ru)).join("\n");

  it("covers what a 152-FZ policy has to cover", () => {
    const ids = PRIVACY_POLICY_SECTIONS.map((section) => section.id);
    for (const required of ["operator", "data", "purposes", "cross-border", "retention", "rights", "children"]) {
      expect(ids).toContain(required);
    }
    expect(russianText).toContain("152-ФЗ");
  });

  it("tells the reader the readings are not fortune-telling or professional advice", () => {
    expect(russianText.toLowerCase()).toContain("гадани");
  });
});

describe("operator details", () => {
  it("shows an obvious bracketed placeholder instead of an invented detail while unset", () => {
    if (!hasUnfilledOperatorDetails()) return;
    for (const value of [OPERATOR.name, OPERATOR.registration, OPERATOR.email]) {
      expect(value.startsWith("[")).toBe(true);
    }
  });

  it("uses a date-shaped policy version so consent records can be ordered", () => {
    expect(PRIVACY_POLICY_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

