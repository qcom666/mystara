/**
 * Реальные положения планет для натальной карты; только для сервера (подключает ряды VSOP87 из
 * astronomia, которым нечего делать в клиентском бандле; импортируется только из
 * calculate-natal-chart.ts, а тот — только из маршрута /api/natal-chart).
 *
 * Обёртка над `astronomia` (JS-порт «Astronomical Algorithms» Жана Мееса), а не ручная реализация
 * орбитальной механики. Для эклиптической системы готового помощника «геоцентрическое положение
 * планеты» нет (только для экваториальной, через `elliptic.position`), поэтому функция ниже
 * (`geocentricEclipticOfDate`) повторяет тот же алгоритм (вычитание прямоугольных координат → одна
 * итерация светового времени → аберрация → FK5 → нутация), но останавливается на шаг раньше:
 * результат остаётся в эклиптической долготе и широте и не переводится в прямое восхождение
 * и склонение.
 *
 * Компромиссы по точности, сделанные намеренно:
 * - ΔT (TT − UT) принимается равной нулю. За последние ~150 лет она не превышает пары минут, что
 *   сдвигает небо на долю градуса: гораздо меньше погрешности, которая обычно есть в записанном
 *   *времени* рождения (ошибка в одну минуту уже сдвигает асцендент примерно на четверть градуса).
 *   Таблица ΔT для этой задачи не нужна.
 * - Плутон считается по отдельному периодическому ряду из главы 37 Мееса, действительному примерно
 *   в 1885–2099 годах; вне этого диапазона он не выводится, а не угадывается (так же, как случай
 *   «секта: не уверен»).
 */
import apparent from "astronomia/apparent";
import base from "astronomia/base";
import julian from "astronomia/julian";
import vsop87Bearth from "astronomia/data/vsop87Bearth";
import vsop87Bjupiter from "astronomia/data/vsop87Bjupiter";
import vsop87Bmars from "astronomia/data/vsop87Bmars";
import vsop87Bmercury from "astronomia/data/vsop87Bmercury";
import vsop87Bneptune from "astronomia/data/vsop87Bneptune";
import vsop87Bsaturn from "astronomia/data/vsop87Bsaturn";
import vsop87Buranus from "astronomia/data/vsop87Buranus";
import vsop87Bvenus from "astronomia/data/vsop87Bvenus";
import moonposition from "astronomia/moonposition";
import nutation from "astronomia/nutation";
import planetposition, { Planet } from "astronomia/planetposition";
import precess from "astronomia/precess";
import { heliocentric as plutoHeliocentric } from "astronomia/pluto";
import solar from "astronomia/solar";

export type EphemerisBodyId = "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto";

export interface EphemerisPosition {
  id: EphemerisBodyId;
  /** Видимая геоцентрическая эклиптическая долгота на истинное равноденствие даты, в градусах [0, 360). */
  longitudeDeg: number;
  /** true только для тел, у которых ретроградное движение реально (не для Солнца и Луны). */
  isRetrograde: boolean | null;
}

// Ряд Плутона из главы 37 Мееса подогнан под 1885–2099 годы; за их пределами Плутон не выводим.
const PLUTO_MIN_JDE = julian.CalendarGregorianToJD(1885, 1, 1);
const PLUTO_MAX_JDE = julian.CalendarGregorianToJD(2099, 12, 31);

const earth = new Planet(vsop87Bearth);
const planets: Partial<Record<EphemerisBodyId, Planet>> = {
  mercury: new Planet(vsop87Bmercury),
  venus: new Planet(vsop87Bvenus),
  mars: new Planet(vsop87Bmars),
  jupiter: new Planet(vsop87Bjupiter),
  saturn: new Planet(vsop87Bsaturn),
  uranus: new Planet(vsop87Buranus),
  neptune: new Planet(vsop87Bneptune),
};

function toDeg360(rad: number): number {
  const deg = (rad * 180) / Math.PI;
  return ((deg % 360) + 360) % 360;
}

/**
 * Геоцентрическая эклиптическая долгота и широта планеты `planet` на момент `jde`, видимая, на истинное
 * равноденствие даты: тот же алгоритм, что у `elliptic.position()` в astronomia (вычитание прямоугольных
 * координат, одна итерация светового времени, годичная аберрация, поправка к системе FK5, нутация
 * по долготе), но без финального перехода из эклиптических координат в экваториальные: знак зодиака
 * определяется именно эклиптической долготой.
 */
function geocentricEclipticOfDate(planet: Planet, jde: number): { lon: number; lat: number; range: number } {
  const posEarth = earth.position(jde);
  const [sB0, cB0] = base.sincos(posEarth.lat);
  const [sL0, cL0] = base.sincos(posEarth.lon);
  const ex = posEarth.range * cB0 * cL0;
  const ey = posEarth.range * cB0 * sL0;
  const ez = posEarth.range * sB0;

  function rectangular(tau: number) {
    const p = planet.position(jde - tau);
    const [sB, cB] = base.sincos(p.lat);
    const [sL, cL] = base.sincos(p.lon);
    return { x: p.range * cB * cL - ex, y: p.range * cB * sL - ey, z: p.range * sB - ez };
  }

  let { x, y, z } = rectangular(0);
  const delta0 = Math.sqrt(x * x + y * y + z * z);
  const tau = base.lightTime(delta0);
  ({ x, y, z } = rectangular(tau));
  const range = Math.sqrt(x * x + y * y + z * z);

  let lon = Math.atan2(y, x);
  let lat = Math.atan2(z, Math.hypot(x, y));

  const [dLon, dLat] = apparent.eclipticAberration(lon, lat, jde);
  const fk5 = planetposition.toFK5(lon + dLon, lat + dLat, jde);
  lon = fk5.lon;
  lat = fk5.lat;

  const [dPsi] = nutation.nutation(jde);
  lon += dPsi;

  return { lon, lat, range };
}

/**
 * То же, что geocentricEclipticOfDate, но для Плутона, у которого ряд задан только гелиоцентрически
 * в системе J2000.
 */
function plutoGeocentricOfDate(jde: number): { lon: number; lat: number; range: number } | null {
  if (jde < PLUTO_MIN_JDE || jde > PLUTO_MAX_JDE) return null;

  const earthJ2000 = earth.position2000(jde);
  const [seB, ceB] = base.sincos(earthJ2000.lat);
  const [seL, ceL] = base.sincos(earthJ2000.lon);
  const ex = earthJ2000.range * ceB * ceL;
  const ey = earthJ2000.range * ceB * seL;
  const ez = earthJ2000.range * seB;

  function rectangular(tau: number) {
    const p = plutoHeliocentric(jde - tau);
    const [sB, cB] = base.sincos(p.lat);
    const [sL, cL] = base.sincos(p.lon);
    return { x: p.range * cB * cL - ex, y: p.range * cB * sL - ey, z: p.range * sB - ez };
  }

  let { x, y, z } = rectangular(0);
  const delta0 = Math.sqrt(x * x + y * y + z * z);
  const tau = base.lightTime(delta0);
  ({ x, y, z } = rectangular(tau));
  const range = Math.sqrt(x * x + y * y + z * z);

  let lon = Math.atan2(y, x);
  const lat = Math.atan2(z, Math.hypot(x, y));

  // Ряд Плутона в системе J2000: приводим (прецессия) к эклиптике даты тем же помощником, который
  // astronomia использует внутри своего пути VSOP87B для той же задачи.
  const epochTo = base.JDEToJulianYear(jde);
  const precessed = precess.eclipticPosition(new base.Coord(lon, lat), 2000.0, epochTo);
  lon = precessed.lon;

  const [dPsi] = nutation.nutation(jde);
  lon += dPsi;

  return { lon, lat: precessed.lat, range };
}

/** Одни сутки динамического времени: достаточно, чтобы заметить стояние планеты, не попадая в него точно. */
const RETROGRADE_PROBE_DAYS = 1;

function isRetrogradeAt(longitudeFn: (jde: number) => number, jde: number): boolean {
  const lonNow = longitudeFn(jde);
  const lonLater = longitudeFn(jde + RETROGRADE_PROBE_DAYS);
  let delta = lonLater - lonNow;
  // Нормализуем кратчайшим путём по кругу, чтобы переход 359°→1° не приняли за «сдвиг назад на 358°».
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta < 0;
}

/**
 * Вычисляет видимую геоцентрическую эклиптическую долготу каждого тела, используемого в натальной
 * карте, на заданный юлианский эфемеридный день. Плутон за пределами допустимого диапазона его ряда
 * не выводится (а не угадывается).
 */
export function getBodyPositions(jde: number): EphemerisPosition[] {
  const results: EphemerisPosition[] = [];

  const sun = solar.apparentVSOP87(earth, jde);
  results.push({ id: "sun", longitudeDeg: toDeg360(sun.lon), isRetrograde: null });

  const moon = moonposition.position(jde);
  const [moonDPsi] = nutation.nutation(jde);
  results.push({ id: "moon", longitudeDeg: toDeg360(moon.lon + moonDPsi), isRetrograde: null });

  for (const id of ["mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune"] as const) {
    const planet = planets[id];
    if (!planet) continue;
    const lonAt = (t: number) => geocentricEclipticOfDate(planet, t).lon;
    results.push({
      id,
      longitudeDeg: toDeg360(lonAt(jde)),
      isRetrograde: isRetrogradeAt(lonAt, jde),
    });
  }

  const pluto = plutoGeocentricOfDate(jde);
  if (pluto) {
    const lonAt = (t: number) => plutoGeocentricOfDate(t)?.lon ?? pluto.lon;
    results.push({ id: "pluto", longitudeDeg: toDeg360(pluto.lon), isRetrograde: isRetrogradeAt(lonAt, jde) });
  }

  return results;
}
