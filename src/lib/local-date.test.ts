import { describe, expect, it } from "vitest";
import { toLocalYmd } from "./local-date";

describe("toLocalYmd", () => {
  it("возвращает ту же дату, из которой сохранённая полночь была создана", () => {
    for (const ymd of ["1990-05-14", "2000-02-29", "1985-12-31", "2026-01-01"]) {
      expect(toLocalYmd(new Date(`${ymd}T00:00:00`))).toBe(ymd);
    }
  });
});
