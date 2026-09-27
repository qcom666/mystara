/**
 * Composes short natal-chart interpretation text from existing building
 * blocks (planet nature, zodiac sign keywords, house theme, aspect meaning)
 * rather than hand-authoring the combinatorial explosion of planet×sign×house
 * text — the same trick number-type-framing.ts uses for numerology. This also
 * means the text is plain composed strings, not an "AI interpretation" (see
 * PROJECT_ARCHITECTURE.md Decision Log #16 on not claiming AI where there
 * isn't one yet).
 */
import { localizeAspectDefinition, ASPECT_DEFINITIONS } from "./aspects.data";
import { localizeHouseTheme, requireHouseTheme } from "./houses.data";
import { localizePlanet, requirePlanetById } from "./planets.data";
import type { AspectType, ChartAspect, PlanetId, PlanetPlacement, ZodiacSignId } from "./types";
import { localizeZodiacSign, requireZodiacSignById } from "./zodiac-signs.data";

type Locale = "en" | "ru";

/** "{Planet} in {Sign} — {planet's domain} carries {sign}'s {keyword}, {keyword}." */
export function describePlacement(placement: PlanetPlacement, locale: Locale): string {
  const planet = localizePlanet(requirePlanetById(placement.planet), locale);
  const sign = localizeZodiacSign(requireZodiacSignById(placement.sign), locale);
  const keywords = sign.keywords.slice(0, 2).join(locale === "ru" ? " и " : " and ");

  if (locale === "ru") {
    return `${planet.name} в ${sign.name} — ${planet.nature} окрашены качествами знака: ${keywords}.`;
  }
  return `${planet.name} in ${sign.name} — ${planet.nature}, colored by this sign's ${keywords}.`;
}

/** "In your {n}th House ({theme}), this shows up around {houseTheme}." */
export function describeHousePlacement(placement: PlanetPlacement, locale: Locale): string | null {
  if (placement.house === null) return null;
  const planet = localizePlanet(requirePlanetById(placement.planet), locale);
  const house = localizeHouseTheme(requireHouseTheme(placement.house), locale);

  if (locale === "ru") {
    return `${planet.name} стоит в ${placement.house}-м доме (${house.title.toLowerCase()}) — здесь это прежде всего проявляется через ${house.theme}.`;
  }
  return `${planet.name} sits in the ${ordinal(placement.house)} House (${house.title.toLowerCase()}), mostly playing out through ${house.theme}.`;
}

export function describeAspect(aspect: ChartAspect, locale: Locale): string {
  const a = localizePlanet(requirePlanetById(aspect.a), locale);
  const b = localizePlanet(requirePlanetById(aspect.b), locale);
  const def = localizeAspectDefinition(requireAspectDefinition(aspect.type), locale);

  if (locale === "ru") {
    return `${a.name} ${def.symbol} ${b.name} (${def.label.toLowerCase()}) — ${def.meaning}.`;
  }
  return `${a.name} ${def.symbol} ${b.name} (${def.label}) — ${def.meaning}.`;
}

export function describeChartRuler(rulerId: PlanetId, ascendantSign: ZodiacSignId, locale: Locale): string {
  const ruler = localizePlanet(requirePlanetById(rulerId), locale);
  const sign = localizeZodiacSign(requireZodiacSignById(ascendantSign), locale);
  if (locale === "ru") {
    return `Управитель асцендента — ${ruler.name}, традиционный правитель знака ${sign.name}. То, как расположена эта планета в вашей карте, задаёт тон всему остальному.`;
  }
  return `Your chart ruler is ${ruler.name}, the traditional ruler of ${sign.name}. Where this planet sits elsewhere in the chart sets the tone for the rest of it.`;
}

function ordinal(n: number): string {
  const suffixes: Record<number, string> = { 1: "st", 2: "nd", 3: "rd" };
  const mod100 = n % 100;
  return `${n}${mod100 >= 11 && mod100 <= 13 ? "th" : (suffixes[n % 10] ?? "th")}`;
}

function requireAspectDefinition(type: AspectType) {
  const def = ASPECT_DEFINITIONS.find((d) => d.type === type);
  if (!def) throw new Error(`Unknown aspect type: "${type}"`);
  return def;
}
