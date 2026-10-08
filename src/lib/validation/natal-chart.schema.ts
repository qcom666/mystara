import { z } from "zod";

/**
 * Либо город из справочника (см. modules/astrology/domain/cities.data.ts), либо место, введённое
 * вручную: оба варианта приводятся к одной форме {latitude, longitude, timezone}, которая нужна
 * движку натальной карты, поэтому маршруту всё равно, какой из них использован.
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
