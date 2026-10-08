import { z } from "zod";

// Общая для числа жизненного пути, числа дня рождения и всех чисел по имени (выражения, души,
// личности, зрелости); см. LifePathNumber в modules/numerology/domain/types.ts.
const NUMEROLOGY_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33] as const;
const ZODIAC_SIGN_IDS = [
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
] as const;

const numerologyNumberSchema = z
  .number()
  .int()
  .refine((n): n is (typeof NUMEROLOGY_NUMBERS)[number] => (NUMEROLOGY_NUMBERS as readonly number[]).includes(n), {
    message: "Not a valid numerology number",
  });

// Выражение/Душа/Личность/Зрелость в одной системе: повторяет NumerologyProfile из
// modules/numerology/domain/types.ts без полей `system`, `lifePathNumber` и `birthdayNumber`.
const numerologyProfileNumbersSchema = z.object({
  expressionNumber: numerologyNumberSchema,
  soulUrgeNumber: numerologyNumberSchema,
  personalityNumber: numerologyNumberSchema,
  maturityNumber: numerologyNumberSchema,
});

export const createNumerologyReadingSchema = z.object({
  birthDate: z.iso.date(),
  lifePathNumber: numerologyNumberSchema,
  birthdayNumber: numerologyNumberSchema,
  // Есть только если в имени есть хотя бы одна буква, которую можно посчитать (см. hasCalculableLetters);
  // имя из одних цифр или неподдерживаемого письма сохраняется как null.
  fullName: z.string().trim().min(1).max(200).nullable().optional(),
  pythagorean: numerologyProfileNumbersSchema.nullable().optional(),
  chaldean: numerologyProfileNumbersSchema.nullable().optional(),
});

export type CreateNumerologyReadingInput = z.infer<typeof createNumerologyReadingSchema>;

export const createAstrologyReadingSchema = z.object({
  birthDate: z.iso.date(),
  sunSign: z.enum(ZODIAC_SIGN_IDS),
  // null, если пользователь выбрал «Не уверен» в AstrologyInputForm.
  sect: z.enum(["day", "night"]).nullable().optional(),
});

export type CreateAstrologyReadingInput = z.infer<typeof createAstrologyReadingSchema>;
