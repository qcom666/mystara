import { createSeededRandom } from "@/lib/rng";
import type { ZodiacSignId } from "@/modules/astrology/domain/types";
import { calculateSunSign } from "@/modules/astrology/services/calculate-sun-sign";
import type { LifePathNumber } from "@/modules/numerology/domain/types";
import { calculateLifePathNumber } from "@/modules/numerology/services/calculate-life-path";
import { getCardName } from "@/modules/tarot/domain/deck";
import type { DrawnCard } from "@/modules/tarot/domain/types";
import { ACTORS } from "../domain/actors.data";
import { MAJOR_ARCANA_ARCHETYPES } from "../domain/major-arcana-archetypes.data";
import type { ActorFunFact } from "../domain/types";

type Locale = "en" | "ru";

// The Russian sentences name the actor in the nominative after a dash
// ("… со звездой кино — Киану Ривз") instead of declining the name into a
// case, which is unreliable for foreign names — and they stay gender-neutral.

function pickDeterministic<T>(items: readonly T[], seed: string): T {
  const random = createSeededRandom(seed);
  return items[Math.floor(random() * items.length)];
}

/** Astrology fun fact: an actor who shares the same sun sign. */
export function getActorFunFactByZodiac(signId: ZodiacSignId, seed: string, locale: Locale = "en"): ActorFunFact | null {
  const matches = ACTORS.filter((actor) => calculateSunSign(new Date(actor.birthDate)).id === signId);
  if (matches.length === 0) return null;
  const actor = pickDeterministic(matches, seed);
  return locale === "ru"
    ? { actorName: actor.nameRu, reason: `Вы делите знак зодиака со звездой кино — ${actor.nameRu}.` }
    : { actorName: actor.name, reason: `You share your zodiac sign with ${actor.name}.` };
}

/** Numerology fun fact: an actor who shares the same Life Path Number. */
export function getActorFunFactByLifePath(lifePathNumber: LifePathNumber, seed: string, locale: Locale = "en"): ActorFunFact | null {
  const matches = ACTORS.filter((actor) => calculateLifePathNumber(new Date(actor.birthDate)) === lifePathNumber);
  if (matches.length === 0) return null;
  const actor = pickDeterministic(matches, seed);
  return locale === "ru"
    ? { actorName: actor.nameRu, reason: `Ваше Число Жизненного Пути — ${lifePathNumber} — совпадает с числом звезды кино: ${actor.nameRu}.` }
    : { actorName: actor.name, reason: `You share Life Path Number ${lifePathNumber} with ${actor.name}.` };
}

/**
 * Tarot fun fact: an actor associated with a similar archetype to one of the
 * drawn cards. Only Major Arcana cards carry an archetype mapping — if the
 * reading drew none, there's nothing sensible to match against, so this
 * returns null rather than forcing a weak connection through a Minor card.
 */
export function getActorFunFactByReading(cards: readonly DrawnCard[], seed: string, locale: Locale = "en"): ActorFunFact | null {
  const majorCard = cards.find((drawn) => drawn.card.arcana === "major" && MAJOR_ARCANA_ARCHETYPES[drawn.card.id]);
  if (!majorCard) return null;

  const tags = MAJOR_ARCANA_ARCHETYPES[majorCard.card.id];
  const matches = ACTORS.filter((actor) => actor.archetypeTags.some((tag) => tags.includes(tag)));
  if (matches.length === 0) return null;

  const actor = pickDeterministic(matches, seed);
  return locale === "ru"
    ? { actorName: actor.nameRu, reason: `Карта «${getCardName(majorCard.card, "ru")}» перекликается по духу со звездой кино — ${actor.nameRu}.` }
    : { actorName: actor.name, reason: `${majorCard.card.name} carries a similar energy to ${actor.name}.` };
}
