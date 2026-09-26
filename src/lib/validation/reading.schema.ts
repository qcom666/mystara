import { z } from "zod";

export const orientationSchema = z.enum(["upright", "reversed"]);

export const readingCardInputSchema = z.object({
  cardId: z.string().min(1),
  positionId: z.string().min(1),
  orientation: orientationSchema,
  order: z.number().int().min(0),
});

export const cardInterpretationInputSchema = z.object({
  positionId: z.string().min(1),
  cardId: z.string().min(1),
  interpretation: z.string(),
});

export const aiInterpretationInputSchema = z.object({
  provider: z.string(),
  summary: z.string(),
  overall: z.string(),
  themes: z.array(z.string()),
  advice: z.array(z.string()),
  challenges: z.array(z.string()),
  cardInterpretations: z.array(cardInterpretationInputSchema),
  generatedAt: z.string(),
});

export const createReadingSchema = z.object({
  spreadId: z.string().min(1),
  question: z.string().trim().max(500).optional().nullable(),
  seed: z.string().min(1),
  cards: z.array(readingCardInputSchema).min(1).max(10),
  // Optional: persists the interpretation already generated during the flow
  // so history/reading-detail can show it without regenerating (and paying
  // for) it again.
  aiInterpretation: aiInterpretationInputSchema.optional(),
});

export type CreateReadingInput = z.infer<typeof createReadingSchema>;

export const aiInterpretRequestSchema = z.object({
  spreadId: z.string().min(1),
  question: z.string().trim().max(500).optional().nullable(),
  cards: z.array(readingCardInputSchema).min(1).max(10),
  locale: z.enum(["en", "ru"]).optional(),
});

export type AIInterpretRequestInput = z.infer<typeof aiInterpretRequestSchema>;

export const favoriteInputSchema = z.object({
  type: z.enum(["CARD", "SPREAD"]),
  targetId: z.string().min(1),
});

export type FavoriteInput = z.infer<typeof favoriteInputSchema>;

export const signupSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email(),
  password: z.string().min(8).max(72),
  // Must be an explicit `true` — an absent or false value is rejected, so an
  // account can't be created without the consent checkbox having been ticked.
  acceptPrivacy: z.literal(true),
});

export const privacyConsentSchema = z.object({
  version: z.string().trim().min(1).max(32),
});

export type SignupInput = z.infer<typeof signupSchema>;
