import { describe, expect, it } from "vitest";
import sitemap from "./sitemap";

describe("карта сайта", () => {
  const entries = sitemap();
  const urls = entries.map((entry) => entry.url);

  it("русские версии рядом с английскими, с hreflang", () => {
    const card = entries.find((entry) => entry.url.endsWith("/ru/tarot/cards/the-fool"));
    expect(card?.alternates?.languages).toEqual({ en: expect.stringMatching(/\/tarot\/cards\/the-fool$/), ru: expect.stringMatching(/\/ru\/tarot\/cards\/the-fool$/) });
    expect(urls.some((url) => url.endsWith("/ru"))).toBe(true);
    expect(urls.some((url) => url.endsWith("/ru/astrology/compatibility/aries-leo"))).toBe(true);
  });

  it("страницы без русской версии только по одному адресу, без дублей", () => {
    expect(urls.some((url) => url.includes("/ru/privacy"))).toBe(false);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.every((url) => !url.endsWith("/"))).toBe(true);
  });
});
