import { GlassPanel } from "@/components/ui/glass-panel";
import { requireAdmin } from "@/lib/admin-guard";
import { FUNNEL, type StoredEventName } from "@/lib/analytics-events";
import { getEventCounts } from "@/lib/analytics-store";

export const dynamic = "force-dynamic";

const LABELS: Record<StoredEventName, string> = {
  landing_viewed: "Главная",
  spread_selected: "Выбран расклад",
  reading_started: "Начат расклад",
  reading_completed: "Карты открыты",
  reading_saved: "Расклад сохранён",
  reading_shared: "Поделились",
  numerology_calculated: "Нумерология",
  astrology_calculated: "Астрология",
  telegram_session_started: "Вход из Telegram",
  signup_completed: "Регистрация",
  checkout_started: "Переход к оплате",
  purchase_paid: "Оплата",
};

const EXTRA: StoredEventName[] = ["reading_shared", "numerology_calculated", "astrology_calculated", "telegram_session_started"];

function percent(part: number, whole: number): string {
  return whole > 0 ? `${Math.round((part / whole) * 100)}%` : "—";
}

/** Воронка по собственной обезличенной статистике (без пользователей и cookie) за 30 дней. */
export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const rows = await getEventCounts(30);

  const totals: Record<string, number> = {};
  for (const row of rows) for (const [name, count] of Object.entries(row.counts)) totals[name] = (totals[name] ?? 0) + count;
  const first = totals[FUNNEL[0]] ?? 0;

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl text-silver-50">Статистика за 30 дней</h1>
      <p className="text-sm text-silver-400">
        Собственная обезличенная статистика: только факт события, день и оболочка (сайт или Telegram), без пользователей, IP и cookie.
      </p>

      <section>
        <h2 className="font-display text-xl text-silver-100">Воронка</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FUNNEL.map((name, index) => {
            const count = totals[name] ?? 0;
            const previous = index > 0 ? (totals[FUNNEL[index - 1]] ?? 0) : count;
            return (
              <GlassPanel key={name} padding="sm">
                <p className="text-xs uppercase tracking-wider text-silver-500">{LABELS[name]}</p>
                <p className="mt-1 text-2xl font-semibold text-silver-50">{count}</p>
                <p className="mt-1 text-xs text-silver-500">
                  {index === 0 ? "начало воронки" : `от прошлого шага ${percent(count, previous)}, от начала ${percent(count, first)}`}
                </p>
              </GlassPanel>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl text-silver-100">По дням</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-silver-500">
              <tr>
                <th className="py-2 pr-4">День</th>
                {[...FUNNEL, ...EXTRA].map((name) => (
                  <th key={name} className="pr-4">
                    {LABELS[name]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={FUNNEL.length + EXTRA.length + 1} className="py-4 text-silver-500">
                    Пока нет событий.
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.day}>
                  <td className="py-2 pr-4 text-silver-300">{row.day}</td>
                  {[...FUNNEL, ...EXTRA].map((name) => (
                    <td key={name} className="pr-4 text-silver-200">
                      {row.counts[name] ?? 0}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
