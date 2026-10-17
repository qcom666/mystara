import { isDatabaseConfigured, prisma } from "@/lib/db";
import { logError } from "@/lib/logger";
import { moscowDay } from "@/modules/tarot/services/daily-card";
import { sanitizeEvent } from "./analytics-events";

export interface EventContext {
  shell: "web" | "telegram";
  locale?: "ru" | "en";
}

/**
 * Записывает событие в собственную статистику. Ошибка записи никогда не мешает основному действию
 * (оплате, регистрации): статистика вторична.
 */
export async function recordEvent(event: unknown, context: EventContext): Promise<boolean> {
  const clean = sanitizeEvent(event);
  if (!clean || !isDatabaseConfigured()) return false;
  try {
    await prisma.analyticsEvent.create({
      data: {
        name: clean.name,
        day: moscowDay(),
        shell: context.shell,
        locale: context.locale ?? null,
        props: Object.keys(clean.props).length > 0 ? clean.props : undefined,
      },
    });
    return true;
  } catch (error) {
    logError("analytics", error);
    return false;
  }
}

export interface FunnelRow {
  day: string;
  counts: Record<string, number>;
}

/** Число событий по дням за последние `days` суток, новые дни сверху. */
export async function getEventCounts(days: number, now: Date = new Date()): Promise<FunnelRow[]> {
  const since = moscowDay(new Date(now.getTime() - (days - 1) * 86_400_000));
  const grouped = await prisma.analyticsEvent.groupBy({
    by: ["day", "name"],
    where: { day: { gte: since } },
    _count: { _all: true },
  });
  const byDay = new Map<string, Record<string, number>>();
  for (const row of grouped) {
    const counts = byDay.get(row.day) ?? {};
    counts[row.name] = row._count._all;
    byDay.set(row.day, counts);
  }
  return [...byDay.entries()].sort(([a], [b]) => (a < b ? 1 : -1)).map(([day, counts]) => ({ day, counts }));
}
