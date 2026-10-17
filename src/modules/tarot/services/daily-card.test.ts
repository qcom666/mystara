import { describe, expect, it } from "vitest";
import { FULL_DECK } from "../domain/deck";
import { dailyCard, moscowDay } from "./daily-card";

describe("dailyCard", () => {
  it("в один день одному человеку выпадает одна и та же карта", () => {
    expect(dailyCard("chat-1", "2026-10-17")).toEqual(dailyCard("chat-1", "2026-10-17"));
  });

  it("на следующий день и у других людей карты меняются", () => {
    const sameDay = new Set(Array.from({ length: 50 }, (_, i) => dailyCard(`chat-${i}`, "2026-10-17").card.id));
    const sameUser = new Set(Array.from({ length: 50 }, (_, i) => dailyCard("chat-1", `2026-11-${String((i % 28) + 1).padStart(2, "0")}`).card.id));
    expect(sameDay.size).toBeGreaterThan(20);
    expect(sameUser.size).toBeGreaterThan(10);
  });

  it("карта всегда из колоды, перевёрнутые встречаются примерно в трети случаев", () => {
    const draws = Array.from({ length: 2000 }, (_, i) => dailyCard(`u${i}`, "2026-10-17"));
    expect(draws.every((draw) => FULL_DECK.includes(draw.card))).toBe(true);
    const reversed = draws.filter((draw) => draw.orientation === "reversed").length / draws.length;
    expect(reversed).toBeGreaterThan(0.25);
    expect(reversed).toBeLessThan(0.35);
  });
});

describe("moscowDay", () => {
  it("день меняется в полночь по Москве, а не по UTC", () => {
    expect(moscowDay(new Date("2026-10-17T20:59:00Z"))).toBe("2026-10-17");
    expect(moscowDay(new Date("2026-10-17T21:01:00Z"))).toBe("2026-10-18");
  });
});
