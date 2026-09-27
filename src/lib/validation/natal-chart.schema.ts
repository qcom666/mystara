import { z } from "zod";

/**
 * Either a curated city (see modules/astrology/domain/cities.data.ts) or a
 * manual place — both resolve to the same {latitude, longitude, timezone}
 * shape the natal-chart engine needs, so the route doesn't care which one
 * was used.
 */
export const createNatalChartSchema = z.object({
  year: z.number().int().min(1, "Year is required"),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  hasExactTime: z.boolean(),
  hour: z.number().int().min(0).max(23).optional(),
  minute: z.number().int().min(0).max(59).optional(),
  cityId: z.string().trim().min(1).optional(),
  placeLabel: z.string().trim().min(1).max(120).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().trim().min(1),
});

export type CreateNatalChartInput = z.infer<typeof createNatalChartSchema>;
