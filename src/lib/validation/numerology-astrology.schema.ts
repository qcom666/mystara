import { z } from "zod";

const LIFE_PATH_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33] as const;
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

export const createNumerologyReadingSchema = z.object({
  birthDate: z.iso.date(),
  lifePathNumber: z
    .number()
    .int()
    .refine((n): n is (typeof LIFE_PATH_NUMBERS)[number] => (LIFE_PATH_NUMBERS as readonly number[]).includes(n), {
      message: "Not a valid life path number",
    }),
});

export type CreateNumerologyReadingInput = z.infer<typeof createNumerologyReadingSchema>;

export const createAstrologyReadingSchema = z.object({
  birthDate: z.iso.date(),
  sunSign: z.enum(ZODIAC_SIGN_IDS),
});

export type CreateAstrologyReadingInput = z.infer<typeof createAstrologyReadingSchema>;
