/**
 * Real planetary positions for the natal chart — server-only (this pulls in
 * astronomia's VSOP87 series, which have no business in a client bundle; it
 * is only ever imported from calculate-natal-chart.ts, itself only imported
 * from the /api/natal-chart route).
 *
 * This wraps `astronomia` (a JS port of Jean Meeus' "Astronomical
 * Algorithms") rather than reimplementing orbital mechanics by hand. Where a
 * ready-made "geocentric position of a planet" helper isn't exposed for the
 * ecliptic frame (only for equatorial, via `elliptic.position`), the function
 * below (`geocentricEclipticOfDate`) mirrors that exact same algorithm
 * (rectangular subtraction → one light-time iteration → aberration → FK5 →
 * nutation), just stopping one step earlier so the result stays in ecliptic
 * longitude/latitude instead of being converted on to right ascension/declination.
 *
 * Precision trade-offs, deliberate and documented (see PROJECT_ARCHITECTURE.md):
 * - ΔT (TT − UT) is treated as zero. Over the last ~150 years this is at most
 *   a couple of minutes, which moves the sky by a fraction of a degree — far
 *   smaller than the uncertainty most people already have in their recorded
 *   birth *time* (a one-minute error there already shifts the Ascendant by
 *   about a quarter of a degree). Not worth a ΔT table for this use case.
 * - Pluto uses Meeus ch. 37's dedicated periodic series, valid ~1885–2099;
 *   outside that range it's omitted rather than guessed (same philosophy as
 *   the existing "sect: not sure" case).
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
  /** Apparent geocentric ecliptic longitude, true equinox of date, in degrees [0, 360). */
  longitudeDeg: number;
  /** True only for bodies where retrograde motion is a real phenomenon (not sun/moon). */
  isRetrograde: boolean | null;
}

// Meeus ch. 37's Pluto series is fitted to 1885–2099; outside that we omit it.
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
 * Geocentric ecliptic longitude/latitude of `planet` at `jde`, apparent, true
 * equinox of date — same algorithm as astronomia's `elliptic.position()`
 * (rectangular subtraction, one light-time iteration, annual aberration,
 * FK5 frame correction, nutation in longitude), stopping before the final
 * ecliptic→equatorial conversion since ecliptic longitude is what a zodiac
 * sign is defined by.
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

/** Same as geocentricEclipticOfDate, but for Pluto, whose series is J2000-frame heliocentric only. */
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

  // Pluto's series is J2000-frame — precess to the ecliptic of date, same
  // helper astronomia's own VSOP87B path uses internally for the same job.
  const epochTo = base.JDEToJulianYear(jde);
  const precessed = precess.eclipticPosition(new base.Coord(lon, lat), 2000.0, epochTo);
  lon = precessed.lon;

  const [dPsi] = nutation.nutation(jde);
  lon += dPsi;

  return { lon, lat: precessed.lat, range };
}

/** One day of dynamical time — plenty to detect a station without landing on it exactly. */
const RETROGRADE_PROBE_DAYS = 1;

function isRetrogradeAt(longitudeFn: (jde: number) => number, jde: number): boolean {
  const lonNow = longitudeFn(jde);
  const lonLater = longitudeFn(jde + RETROGRADE_PROBE_DAYS);
  let delta = lonLater - lonNow;
  // Normalize the shortest way around the circle so a 359°→1° wrap isn't
  // mistaken for "moved backward by 358°".
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta < 0;
}

/**
 * Computes the apparent geocentric ecliptic longitude of every body used in
 * the natal chart at the given Julian Ephemeris Day. Pluto is omitted (not
 * guessed) outside its series' valid range.
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
