import { createSeededRandom } from "@/lib/rng";
import {
  type Bilingual,
  ELEMENT_ADVICE,
  HOUSE_RATING_SHIFTS,
  MERCURY_RETROGRADE_NOTE,
  MOON_PHASE_NOTES,
  MOON_SIGN_MOOD,
  type MoonPhase,
  SOLAR_HOUSE_THEMES,
} from "../domain/horoscope.data";
import type { ZodiacSignId } from "../domain/types";
import { getAllZodiacSigns, requireZodiacSignById } from "../domain/zodiac-signs.data";

/** Небо дня, от которого строятся гороскопы всех знаков (см. sky-of-day.ts). */
export interface SkyOfDay {
  /** Московский день «ГГГГ-ММ-ДД». */
  day: string;
  moonSign: ZodiacSignId;
  moonPhase: MoonPhase;
  mercuryRetrograde: boolean;
}

export interface HoroscopeRatings {
  love: number;
  work: number;
  energy: number;
}

export interface DailyHoroscope {
  sign: ZodiacSignId;
  day: string;
  /** Дом Луны, считая от знака читателя, 1–12. */
  house: number;
  ratings: HoroscopeRatings;
  mood: Bilingual;
  theme: Bilingual;
  phase: Bilingual;
  advice: Bilingual;
  mercury: Bilingual | null;
}

const SIGN_ORDER = getAllZodiacSigns().map((sign) => sign.id);

/** Номер дома, в котором стоит Луна, если считать дома от знака `sign` (целые знаки). */
export function solarHouse(sign: ZodiacSignId, moonSign: ZodiacSignId): number {
  return ((SIGN_ORDER.indexOf(moonSign) - SIGN_ORDER.indexOf(sign) + 12) % 12) + 1;
}

const clampRating = (value: number) => Math.min(5, Math.max(1, value));

/**
 * Гороскоп знака на день. Детерминирован: тот же знак и то же небо дают тот же текст, поэтому страница,
 * бот и повторные запросы показывают одно и то же.
 */
export function buildDailyHoroscope(sign: ZodiacSignId, sky: SkyOfDay): DailyHoroscope {
  const random = createSeededRandom(`horoscope:${sign}:${sky.day}`);
  const house = solarHouse(sign, sky.moonSign);
  const theme = SOLAR_HOUSE_THEMES[house - 1][random() < 0.5 ? 0 : 1];
  const adviceList = ELEMENT_ADVICE[requireZodiacSignById(sign).element];
  const advice = adviceList[Math.floor(random() * adviceList.length)];

  const shift = HOUSE_RATING_SHIFTS[house - 1];
  const phaseEnergy = sky.moonPhase === "full" ? 1 : sky.moonPhase === "new" ? -1 : 0;
  // Небольшой разброс, чтобы соседние дни в одном доме не выглядели одинаково.
  const jitter = () => [-1, 0, 0, 1][Math.floor(random() * 4)];
  const ratings: HoroscopeRatings = {
    love: clampRating(3 + shift.love + jitter()),
    work: clampRating(3 + shift.work - (sky.mercuryRetrograde ? 1 : 0) + jitter()),
    energy: clampRating(3 + shift.energy + phaseEnergy + jitter()),
  };

  return {
    sign,
    day: sky.day,
    house,
    ratings,
    mood: MOON_SIGN_MOOD[sky.moonSign],
    theme,
    phase: MOON_PHASE_NOTES[sky.moonPhase],
    advice,
    mercury: sky.mercuryRetrograde ? MERCURY_RETROGRADE_NOTE : null,
  };
}

/** Фаза Луны по элонгации (угол Луна − Солнце по эклиптике), восемь классических фаз по 45°. */
export function moonPhaseFromElongation(elongationDeg: number): MoonPhase {
  const phases: MoonPhase[] = ["new", "waxing_crescent", "first_quarter", "waxing_gibbous", "full", "waning_gibbous", "last_quarter", "waning_crescent"];
  const normalized = ((elongationDeg % 360) + 360) % 360;
  return phases[Math.floor(((normalized + 22.5) % 360) / 45)];
}
