/**
 * Ascendant and Midheaven — the two angles whole-sign houses are built from.
 * Standard spherical-astronomy formulas (RAMC → ecliptic longitude), the same
 * ones used across essentially every astrology-calculation implementation:
 *
 *   RAMC = local sidereal time, expressed in degrees of Right Ascension
 *   MC  = atan2( sin(RAMC), cos(RAMC)·cos(ε) )
 *   Asc = atan2( cos(RAMC), −(sin(ε)·tan(φ) + cos(ε)·sin(RAMC)) )
 *
 * where ε is the obliquity of the ecliptic and φ is the observer's latitude.
 * Both are independently re-derivable from the standard ecliptic↔equatorial
 * conversion for a point with ecliptic latitude 0 (MC) and altitude 0 (Asc),
 * and both reduce to the obviously-correct degenerate case Asc = RAMC + 90°
 * when ε = 0 and φ = 0 (no ecliptic tilt ⇒ the rising point is a quarter
 * turn from the meridian, same as the equator).
 *
 * Same ΔT-is-negligible simplification as ephemeris.ts: sidereal time is
 * computed from the plain UT-based Julian Day, not from JDE via a ΔT table.
 */
import base from "astronomia/base";
import nutation from "astronomia/nutation";
import sidereal from "astronomia/sidereal";

export interface ChartAngles {
  /** Ecliptic longitude of the Ascendant, degrees [0, 360). */
  ascendantDeg: number;
  /** Ecliptic longitude of the Midheaven, degrees [0, 360). */
  midheavenDeg: number;
}

function toDeg360(rad: number): number {
  const deg = (rad * 180) / Math.PI;
  return ((deg % 360) + 360) % 360;
}

/**
 * @param jdUt Julian Day of the birth instant, UT (not JDE — see module doc).
 * @param latitudeDeg Observer's geographic latitude, degrees north-positive.
 * @param longitudeDeg Observer's geographic longitude, degrees east-positive.
 */
export function calculateChartAngles(jdUt: number, latitudeDeg: number, longitudeDeg: number): ChartAngles {
  const gstSeconds = sidereal.apparent(jdUt); // [0, 86400)
  const gstDeg = gstSeconds / 240; // 86400s = 360°, so 1s = 1/240°
  const ramcDeg = ((gstDeg + longitudeDeg) % 360 + 360) % 360;
  const ramcRad = (ramcDeg * Math.PI) / 180;

  const epsilon = nutation.meanObliquity(jdUt);
  const [sEps, cEps] = base.sincos(epsilon);
  const phiRad = (latitudeDeg * Math.PI) / 180;

  const midheavenRad = Math.atan2(Math.sin(ramcRad), Math.cos(ramcRad) * cEps);
  const ascendantRad = Math.atan2(Math.cos(ramcRad), -(sEps * Math.tan(phiRad) + cEps * Math.sin(ramcRad)));

  return { ascendantDeg: toDeg360(ascendantRad), midheavenDeg: toDeg360(midheavenRad) };
}
