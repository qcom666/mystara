import type { Sect, SectProfile } from "./types";

/**
 * "Sect" — a real, traditional (Hellenistic) astrological concept: a chart
 * is diurnal (day) if the Sun was above the horizon at birth, nocturnal
 * (night) if below. This is exactly what asking "day or night?" captures —
 * we deliberately do NOT pretend to compute real sunrise/sunset from date +
 * location (that needs an actual ephemeris/geolocation, out of scope; see
 * PROJECT_ARCHITECTURE.md), so the person's own direct answer is the
 * honest input here, not a fabricated calculation.
 *
 * The Russian copy avoids the bare loanword "секта" (which reads as "cult")
 * and speaks of a "дневная / ночная карта" instead.
 */
export const SECT_PROFILES: Record<Sect, SectProfile> = {
  day: {
    id: "day",
    title: "Day Chart",
    titleRu: "Дневная карта",
    description:
      "Born with the Sun above the horizon. In the old Hellenistic tradition, a day chart is read as more outward, active, and identity-driven — the Sun's own light setting the tone.",
    descriptionRu:
      "Родились при Солнце над горизонтом. В древней эллинистической традиции дневная карта читается как более внешняя, деятельная и ориентированная на личность — тон задаёт собственный свет Солнца.",
    favoredPlanets: ["Sun", "Jupiter", "Saturn"],
    keynote: "This reading may suggest your chart leans on reason, structure, and visible action as natural strengths.",
    keynoteRu: "Этот расклад может говорить, что ваша карта опирается на разум, структуру и видимое действие как на естественные сильные стороны.",
  },
  night: {
    id: "night",
    title: "Night Chart",
    titleRu: "Ночная карта",
    description:
      "Born with the Sun below the horizon. A night chart is traditionally read as more inward, emotional, and instinct-driven — the Moon's reflected light setting the tone instead.",
    descriptionRu:
      "Родились при Солнце под горизонтом. Ночная карта традиционно читается как более внутренняя, эмоциональная и инстинктивная — тон задаёт отражённый свет Луны.",
    favoredPlanets: ["Moon", "Venus", "Mars"],
    keynote: "This reading may suggest your chart leans on intuition, feeling, and instinct as natural strengths.",
    keynoteRu: "Этот расклад может говорить, что ваша карта опирается на интуицию, чувства и инстинкт как на естественные сильные стороны.",
  },
};

export const SECT_MERCURY_NOTE =
  "Mercury sits outside this split — traditionally, it takes on the sect of whichever luminary (Sun or Moon) it rises nearest to.";

export const SECT_MERCURY_NOTE_RU =
  "Меркурий стоит вне этого деления — традиционно он принимает сторону того светила (Солнца или Луны), к которому ближе всего восходит.";

export function getSectProfile(sect: Sect): SectProfile {
  return SECT_PROFILES[sect];
}

/** The profile with its text in the requested language (English by default). */
export function localizeSectProfile(profile: SectProfile, locale: "en" | "ru"): SectProfile {
  if (locale !== "ru") return profile;
  return { ...profile, title: profile.titleRu, description: profile.descriptionRu, keynote: profile.keynoteRu };
}

export function getSectMercuryNote(locale: "en" | "ru"): string {
  return locale === "ru" ? SECT_MERCURY_NOTE_RU : SECT_MERCURY_NOTE;
}
