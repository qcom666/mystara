import { describe, expect, it } from "vitest";
import { hasRussianVersion, languageAlternates, localeFromPathname, localizeHref, stripLocalePrefix } from "./localized-routes";

describe("русские адреса", () => {
  it("язык из адреса", () => {
    expect(localeFromPathname("/ru")).toBe("ru");
    expect(localeFromPathname("/ru/tarot/cards/the-fool")).toBe("ru");
    expect(localeFromPathname("/rules")).toBeNull();
    expect(localeFromPathname("/tarot")).toBeNull();
    expect(localeFromPathname(null)).toBeNull();
  });

  it("снятие префикса", () => {
    expect(stripLocalePrefix("/ru")).toBe("/");
    expect(stripLocalePrefix("/ru/astrology/horoscope/leo")).toBe("/astrology/horoscope/leo");
    expect(stripLocalePrefix("/account")).toBe("/account");
  });

  it("у каких страниц есть русская версия", () => {
    for (const path of ["/", "/reading", "/tarot/cards", "/tarot/cards/the-fool", "/astrology/leo", "/astrology/horoscope", "/astrology/compatibility/aries-leo", "/numerology/7"]) {
      expect(hasRussianVersion(path)).toBe(true);
    }
    for (const path of ["/account", "/login", "/admin", "/reading/three-card", "/astrology/foo", "/astrology/compatibility/aries-cat", "/privacy"]) {
      expect(hasRussianVersion(path)).toBe(false);
    }
  });

  it("ссылки для русскоязычного посетителя", () => {
    expect(localizeHref("/tarot/cards?suit=cups#top", "ru")).toBe("/ru/tarot/cards?suit=cups#top");
    expect(localizeHref("/", "ru")).toBe("/ru");
    expect(localizeHref("/account", "ru")).toBe("/account");
    expect(localizeHref("/ru/tarot", "ru")).toBe("/ru/tarot");
    expect(localizeHref("https://t.me/x", "ru")).toBe("https://t.me/x");
    expect(localizeHref("//evil.example/tarot", "ru")).toBe("//evil.example/tarot");
    expect(localizeHref("/tarot", "en")).toBe("/tarot");
  });

  it("hreflang и canonical", () => {
    expect(languageAlternates("/tarot", "ru")).toEqual({
      canonical: "/ru/tarot",
      languages: { en: "/tarot", ru: "/ru/tarot", "x-default": "/tarot" },
    });
    expect(languageAlternates("/", "en").languages.ru).toBe("/ru");
    expect(languageAlternates("/", "en").canonical).toBe("/");
  });
});
