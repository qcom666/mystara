import { z } from "zod";

// Shared by Life Path, Birthday, and every name-derived number (Expression,
// Soul Urge, Personality, Maturity) — see modules/numerology/domain/types.ts LifePathNumber.
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

// Expression/Soul Urge/Personality/Maturity under one system — mirrors
// modules/numerology/domain/types.ts NumerologyProfile minus its `system`/`lifePathNumber`/`birthdayNumber`.
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
  // Present only when the name had at least one calculable letter (see
  // hasCalculableLetters) — a digits-only or unsupported-script name saves as null.
  fullName: z.string().trim().min(1).max(200).nullable().optional(),
  pythagorean: numerologyProfileNumbersSchema.nullable().optional(),
  chaldean: numerologyProfileNumbersSchema.nullable().optional(),
});

export type CreateNumerologyReadingInput = z.infer<typeof createNumerologyReadingSchema>;

export const createAstrologyReadingSchema = z.object({
  birthDate: z.iso.date(),
  sunSign: z.enum(ZODIAC_SIGN_IDS),
  // null when the user picked "Not sure" in AstrologyInputForm.
  sect: z.enum(["day", "night"]).nullable().optional(),
});

export type CreateAstrologyReadingInput = z.infer<typeof createAstrologyReadingSchema>;
