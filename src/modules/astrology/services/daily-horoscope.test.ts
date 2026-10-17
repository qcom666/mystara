import { describe, expect, it } from "vitest";
import { getAllZodiacSigns } from "../domain/zodiac-signs.data";
import { buildDailyHoroscope, moonPhaseFromElongation, solarHouse, type SkyOfDay } from "./daily-horoscope";
import { getSkyOfDay } from "./sky-of-day";

const sky: SkyOfDay = { day: "2026-10-17", moonSign: "capricorn", moonPhase: "first_quarter", mercuryRetrograde: false };

describe("гороскоп на день", () => {
  it("дом Луны считается от знака читателя", () => {
    expect(solarHouse("capricorn", "capricorn")).toBe(1);
    expect(solarHouse("sagittarius", "capricorn")).toBe(2);
    expect(solarHouse("aquarius", "capricorn")).toBe(12);
    expect(solarHouse("cancer", "capricorn")).toBe(7);
  });

  it("детерминирован и заполнен для каждого знака", () => {
    for (const { id } of getAllZodiacSigns()) {
      const horoscope = buildDailyHoroscope(id, sky);
      expect(horoscope).toEqual(buildDailyHoroscope(id, sky));
      for (const value of Object.values(horoscope.ratings)) expect([1, 2, 3, 4, 5]).toContain(value);
      expect(horoscope.mood.ru).toContain("Луна в Козероге");
      expect(horoscope.mercury).toBeNull();
    }
  });

  it("ретроградный Меркурий добавляет предупреждение", () => {
    expect(buildDailyHoroscope("leo", { ...sky, mercuryRetrograde: true }).mercury?.ru).toContain("Меркурий");
  });

  it("фазы Луны по элонгации", () => {
    expect(moonPhaseFromElongation(0)).toBe("new");
    expect(moonPhaseFromElongation(350)).toBe("new");
    expect(moonPhaseFromElongation(90)).toBe("first_quarter");
    expect(moonPhaseFromElongation(180)).toBe("full");
    expect(moonPhaseFromElongation(-90)).toBe("last_quarter");
  });

  it("небо дня совпадает с известными событиями октября 2026", () => {
    expect(getSkyOfDay("2026-10-10")).toMatchObject({ moonSign: "libra", moonPhase: "new" });
    expect(getSkyOfDay("2026-10-26")).toMatchObject({ moonSign: "taurus", moonPhase: "full", mercuryRetrograde: true });
    expect(getSkyOfDay("2026-10-17").mercuryRetrograde).toBe(false);
  });
});
