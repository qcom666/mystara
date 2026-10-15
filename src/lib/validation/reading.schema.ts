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
  // Необязательно: сохраняет толкование, уже сгенерированное по ходу расклада, чтобы история и детали
  // расклада показывали его без повторной генерации (и оплаты).
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

export const privacyConsentSchema = z.object({
  version: z.string().trim().min(1).max(32),
});

