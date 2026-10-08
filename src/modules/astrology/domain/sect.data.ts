import type { Sect, SectProfile } from "./types";

/**
 * «Секта» — настоящее традиционное (эллинистическое) астрологическое понятие: карта дневная, если при
 * рождении Солнце было над горизонтом, и ночная, если под ним. Именно это и выясняет вопрос «день
 * или ночь?»: мы намеренно НЕ делаем вид, что считаем настоящие восход и закат по дате и месту (для
 * этого нужны эфемериды и геолокация), поэтому входными данными служит прямой ответ человека,
 * а не выдуманный расчёт.
 *
 * В русском тексте не используется голое заимствование «секта» (оно читается как «культ»):
 * говорится о «дневной / ночной карте».
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

/** Профиль с текстом на запрошенном языке (по умолчанию английский). */
export function localizeSectProfile(profile: SectProfile, locale: "en" | "ru"): SectProfile {
  if (locale !== "ru") return profile;
  return { ...profile, title: profile.titleRu, description: profile.descriptionRu, keynote: profile.keynoteRu };
}

export function getSectMercuryNote(locale: "en" | "ru"): string {
  return locale === "ru" ? SECT_MERCURY_NOTE_RU : SECT_MERCURY_NOTE;
}
