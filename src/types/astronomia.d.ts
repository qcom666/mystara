/**
 * `astronomia` (the VSOP87/Meeus astronomical-algorithms library used for the
 * natal chart's planetary positions, see modules/astrology/services/ephemeris.ts)
 * ships no TypeScript types. These are loose, hand-written declarations for
 * only the subpaths and members this codebase actually calls — not a full
 * typing of the library. Untyped `any` values below are intentional; every
 * call site that touches them lives in ephemeris.ts and converts to the
 * project's own strongly-typed domain shapes immediately.
 */

declare module "astronomia/base" {
  export class Coord {
    constructor(ra?: number, dec?: number, range?: number, elongation?: number);
    lon: number;
    lat: number;
    ra: number;
    dec: number;
    range?: number;
    elongation?: number;
  }
  const base: {
    Coord: typeof Coord;
    AU: number;
    pmod(x: number, y: number): number;
    sincos(x: number): [number, number];
    lightTime(distanceAu: number): number;
    J2000Century(jde: number): number;
    JDEToJulianYear(jde: number): number;
    toRad(deg: number): number;
    toDeg(rad: number): number;
  };
  export default base;
}

declare module "astronomia/julian" {
  const julian: {
    CalendarGregorianToJD(year: number, month: number, day: number): number;
  };
  export default julian;
}

declare module "astronomia/sidereal" {
  const sidereal: {
    /** Apparent sidereal time at Greenwich, in seconds of time, range [0, 86400). */
    apparent(jd: number): number;
    mean(jd: number): number;
  };
  export default sidereal;
}

declare module "astronomia/nutation" {
  const nutation: {
    /** Returns [nutation in longitude, nutation in obliquity], both in radians. */
    nutation(jde: number): [number, number];
    meanObliquity(jde: number): number;
  };
  export default nutation;
}

declare module "astronomia/apparent" {
  const apparent: {
    /** Returns [Δλ, Δβ] aberration correction for ecliptic coordinates, in radians. */
    eclipticAberration(lon: number, lat: number, jd: number): [number, number];
  };
  export default apparent;
}

declare module "astronomia/precess" {
  import type { Coord } from "astronomia/base";
  const precess: {
    eclipticPosition(eclFrom: Coord, epochFrom: number, epochTo: number): Coord;
  };
  export default precess;
}

declare module "astronomia/solar" {
  import type { Planet } from "astronomia/planetposition";
  const solar: {
    apparentVSOP87(earth: Planet, jde: number): { lon: number; lat: number; range: number };
  };
  export default solar;
}

declare module "astronomia/moonposition" {
  import type { Coord } from "astronomia/base";
  const moonposition: {
    /** Geocentric ecliptic position of the Moon, mean equinox of date, range in km. Excludes nutation. */
    position(jde: number): Coord;
  };
  export default moonposition;
}

declare module "astronomia/planetposition" {
  export class Planet {
    constructor(vsop87Data: unknown);
    /** Heliocentric ecliptic position, dynamical equinox and ecliptic of J2000. */
    position2000(jde: number): { lon: number; lat: number; range: number };
    /** Heliocentric ecliptic position, equinox and ecliptic of date. */
    position(jde: number): { lon: number; lat: number; range: number };
  }
  const planetposition: {
    Planet: typeof Planet;
    toFK5(lon: number, lat: number, jde: number): { lon: number; lat: number };
  };
  export default planetposition;
}

declare module "astronomia/pluto" {
  /** Heliocentric ecliptic position of Pluto, J2000 frame — valid roughly 1885–2099 (Meeus ch. 37). */
  export function heliocentric(jde: number): { lon: number; lat: number; range: number };
}

declare module "astronomia/data/vsop87Bearth" {
  const data: unknown;
  export default data;
}
declare module "astronomia/data/vsop87Bmercury" {
  const data: unknown;
  export default data;
}
declare module "astronomia/data/vsop87Bvenus" {
  const data: unknown;
  export default data;
}
declare module "astronomia/data/vsop87Bmars" {
  const data: unknown;
  export default data;
}
declare module "astronomia/data/vsop87Bjupiter" {
  const data: unknown;
  export default data;
}
declare module "astronomia/data/vsop87Bsaturn" {
  const data: unknown;
  export default data;
}
declare module "astronomia/data/vsop87Buranus" {
  const data: unknown;
  export default data;
}
declare module "astronomia/data/vsop87Bneptune" {
  const data: unknown;
  export default data;
}
