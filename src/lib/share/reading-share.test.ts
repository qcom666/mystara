import { describe, expect, it } from "vitest";
import { requireCardById } from "@/modules/tarot/domain/deck";
import { requireSpreadById } from "@/modules/tarot/domain/spreads.data";
import type { DrawnCard } from "@/modules/tarot/domain/types";
import { buildShareImagePath, encodeShareCards, parseShareRequest, toRoman } from "./reading-share";

const spread = requireSpreadById("three-card");
const drawn: DrawnCard[] = [
  { card: requireCardById("the-fool"), orientation: "upright", position: spread.positions[0] },
  { card: requireCardById("the-tower"), orientation: "reversed", position: spread.positions[1] },
  { card: requireCardById("queen-of-cups"), orientation: "upright", position: spread.positions[2] },
];

describe("картинка расклада", () => {
  it("в адрес попадают только расклад, карты и язык, без вопроса", () => {
    const path = buildShareImagePath("three-card", drawn, "ru");
    expect(path).toBe("/api/share/reading?spread=three-card&cards=the-fool.u%2Cthe-tower.r%2Cqueen-of-cups.u&locale=ru&format=story");
    expect(encodeShareCards(drawn)).toBe("the-fool.u,the-tower.r,queen-of-cups.u");
  });

  it("разбирает адрес обратно в названия на нужном языке и с позициями", () => {
    const view = parseShareRequest(new URLSearchParams({ spread: "three-card", cards: "the-fool.u,the-tower.r,queen-of-cups.u", locale: "ru" }));
    expect(view?.spreadName).toMatch(/[А-Яа-я]/);
    expect(view?.cards.map((card) => card.reversed)).toEqual([false, true, false]);
    expect(view?.cards[0].mark).toBe("0");
    expect(view?.cards[1].mark).toBe("XVI");
    expect(view?.cards[2].mark).toBe("Королева");
    expect(view?.cards.every((card) => /[А-Яа-я]/.test(card.name) && card.position.length > 0)).toBe(true);
    expect(view?.format).toBe("story");
  });

  it("отвергает чужие и подделанные наборы карт", () => {
    const bad = [
      { spread: "nope", cards: "the-fool.u" },
      { spread: "three-card", cards: "the-fool.u,the-tower.r" },
      { spread: "three-card", cards: "the-fool.u,the-fool.r,the-tower.u" },
      { spread: "three-card", cards: "the-fool.u,unknown-card.r,the-tower.u" },
      { spread: "three-card", cards: "the-fool.x,the-tower.r,the-star.u" },
      { spread: "three-card", cards: "<script>.u,the-tower.r,the-star.u" },
    ];
    for (const params of bad) expect(parseShareRequest(new URLSearchParams(params))).toBeNull();
  });

  it("римские цифры старших арканов", () => {
    expect([0, 1, 4, 9, 14, 19, 21].map(toRoman)).toEqual(["0", "I", "IV", "IX", "XIV", "XIX", "XXI"]);
  });
});
