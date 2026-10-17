import { timingSafeEqual } from "node:crypto";

/** Запрос планировщика Vercel: заголовок `Authorization: Bearer <CRON_SECRET>`, сравнение за постоянное время. */
export function cronAuthorized(header: string | null, secret: string): boolean {
  if (!header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  return expected.length === received.length && timingSafeEqual(expected, received);
}
