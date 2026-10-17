import { describe, expect, it } from "vitest";
import { localizedMetadata, shortDescription } from "./page-metadata";

describe("metadata страниц", () => {
  it("русская версия: canonical на /ru, hreflang на обе, локаль Open Graph", () => {
    const metadata = localizedMetadata({ path: "/tarot/cards/the-fool", locale: "ru", title: "Шут — значение карты Таро", description: "Новое начало." });
    expect(metadata.title).toBe("Шут — значение карты Таро");
    expect(metadata.alternates).toEqual({
      canonical: "/ru/tarot/cards/the-fool",
      languages: { en: "/tarot/cards/the-fool", ru: "/ru/tarot/cards/the-fool", "x-default": "/tarot/cards/the-fool" },
    });
    expect(metadata.openGraph).toMatchObject({ locale: "ru_RU", url: "/ru/tarot/cards/the-fool", title: "Шут — значение карты Таро · Mystara" });
  });

  it("заголовок без шаблона для главной", () => {
    expect(localizedMetadata({ path: "/", locale: "ru", title: "Mystara", description: "x", absoluteTitle: true }).title).toEqual({ absolute: "Mystara" });
  });

  it("длинное описание обрезается по слову", () => {
    const text = "слово ".repeat(60);
    const short = shortDescription(text);
    expect(short.length).toBeLessThanOrEqual(160);
    expect(short.endsWith("…")).toBe(true);
    expect(short).not.toMatch(/\s…$/);
    expect(shortDescription("Коротко.")).toBe("Коротко.");
  });
});
