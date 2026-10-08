import julian from "astronomia/julian";
import { SIGN_RULER } from "../domain/planets.data";
import { getZodiacSignByLongitude } from "../domain/zodiac-signs.data";
import type { AspectType, ChartAspect, NatalChart, NatalChartInput, PlanetId, PlanetPlacement, ZodiacSignId } from "../domain/types";
import { calculateChartAngles } from "./chart-angles";
import { getBodyPositions } from "./ephemeris";

const ASPECT_ANGLES: { type: AspectType; angleDeg: number; orbDeg: number }[] = [
  { type: "conjunction", angleDeg: 0, orbDeg: 8 },
  { type: "sextile", angleDeg: 60, orbDeg: 5 },
  { type: "square", angleDeg: 90, orbDeg: 7 },
  { type: "trine", angleDeg: 120, orbDeg: 7 },
  { type: "opposition", angleDeg: 180, orbDeg: 8 },
];

function toJulianDay(date: Date): number {
  // Обычная юлианская дата по UT, используется и как JDE (ΔT считаем пренебрежимой:
  // обоснование в описании модуля ephemeris.ts).
  const day =
    date.getUTCDate() +
    (date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600) / 24;
  return julian.CalendarGregorianToJD(date.getUTCFullYear(), date.getUTCMonth() + 1, day);
}

function angularSeparation(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function wholeSignHouse(bodyLongitudeDeg: number, ascendantSignIndex: number): number {
  const bodySignIndex = Math.floor(((bodyLongitudeDeg % 360) + 360) % 360 / 30);
  return ((bodySignIndex - ascendantSignIndex + 12) % 12) + 1;
}

function signIndex(signId: ZodiacSignId): number {
  const order: ZodiacSignId[] = [
    "aries",
    "taurus",
    "gemini",
    "cancer",
    "leo",
    "virgo",
    "libra",
    "scorpio",
    "sagittarius",
    "capricorn",
    "aquarius",
    "pisces",
  ];
  return order.indexOf(signId);
}

/**
 * Единственная чистая точка входа расчёта натальной карты: реальные положения тел и (если время
 * рождения известно) реальные дома и углы, без сетевых вызовов, полностью детерминированно для одного
 * входа. Форму результата см. в NatalChart (domain/types.ts).
 */
export function calculateNatalChart(input: NatalChartInput): NatalChart {
  const jd = toJulianDay(input.birthDateUtc);
  const positions = getBodyPositions(jd);

  let ascendantSignIdx: number | null = null;
  let ascendant: NatalChart["ascendant"] = null;
  let midheaven: NatalChart["midheaven"] = null;
  let chartRuler: PlanetId | null = null;

  if (input.hasExactTime) {
    const angles = calculateChartAngles(jd, input.latitude, input.longitude);
    const asc = getZodiacSignByLongitude(angles.ascendantDeg);
    const mc = getZodiacSignByLongitude(angles.midheavenDeg);
    ascendant = { longitudeDeg: angles.ascendantDeg, sign: asc.sign.id, degreeInSign: asc.degreeInSign };
    midheaven = { longitudeDeg: angles.midheavenDeg, sign: mc.sign.id, degreeInSign: mc.degreeInSign };
    ascendantSignIdx = signIndex(asc.sign.id);
    chartRuler = SIGN_RULER[asc.sign.id];
  }

  const planets: PlanetPlacement[] = positions.map((position) => {
    const { sign, degreeInSign } = getZodiacSignByLongitude(position.longitudeDeg);
    return {
      planet: position.id,
      longitudeDeg: position.longitudeDeg,
      sign: sign.id,
      degreeInSign,
      house: ascendantSignIdx === null ? null : wholeSignHouse(position.longitudeDeg, ascendantSignIdx),
      isRetrograde: position.isRetrograde,
    };
  });

  const aspects: ChartAspect[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const sep = angularSeparation(planets[i].longitudeDeg, planets[j].longitudeDeg);
      let best: { type: AspectType; orb: number } | null = null;
      for (const def of ASPECT_ANGLES) {
        const orb = Math.abs(sep - def.angleDeg);
        if (orb <= def.orbDeg && (!best || orb < best.orb)) best = { type: def.type, orb };
      }
      if (best) aspects.push({ a: planets[i].planet, b: planets[j].planet, type: best.type, orb: best.orb });
    }
  }
  aspects.sort((a, b) => a.orb - b.orb);

  return { planets, ascendant, midheaven, chartRuler, aspects };
}
