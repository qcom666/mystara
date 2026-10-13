import Link from "next/link";
import { formatDateTime, formatMoney, PRODUCT_LABELS, STATUS_LABELS, userLabel } from "@/components/admin/format";
import { GlassPanel } from "@/components/ui/glass-panel";
import { requireAdmin } from "@/lib/admin-guard";
import { getDashboardStats } from "@/lib/repositories/admin.repository";

export const dynamic = "force-dynamic";

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <GlassPanel padding="sm">
      <p className="text-xs uppercase tracking-wider text-silver-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-silver-50">{value}</p>
      {hint && <p className="mt-1 text-xs text-silver-500">{hint}</p>}
    </GlassPanel>
  );
}

export default async function AdminDashboardPage() {
  await requireAdmin();
  const stats = await getDashboardStats();

  const revenue = new Map<string, number>();
  for (const row of stats.paidByProduct) revenue.set(row.currency, (revenue.get(row.currency) ?? 0) + row.sum);
  const paidCount = stats.paidByProduct.reduce((total, row) => total + row.count, 0);

  return (
    <div className="space-y-10">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Пользователей" value={stats.users} hint={`за 7 дней: +${stats.newUsers}, из Telegram: ${stats.telegramUsers}`} />
        <Stat label="Premium сейчас" value={stats.premiumActive} />
        <Stat
          label="Оплаченных покупок"
          value={paidCount}
          hint={[...revenue].map(([currency, sum]) => formatMoney(sum, currency)).join(" · ") || "пока нет"}
        />
        <Stat label="Зависшие оплаты" value={stats.stalePending} hint="ожидают оплаты больше часа" />
        <Stat label="Раскладов за 30 дней" value={stats.readings30} />
        <Stat label="Натальных карт за 30 дней" value={stats.natalCharts30} />
      </section>

      {stats.paidByProduct.length > 0 && (
        <section>
          <h2 className="font-display text-xl text-silver-100">Продажи по товарам</h2>
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-xs uppercase text-silver-500">
              <tr>
                <th className="py-2">Товар</th>
                <th>Штук</th>
                <th>Сумма</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {stats.paidByProduct.map((row) => (
                <tr key={`${row.product}-${row.currency}`}>
                  <td className="py-2 text-silver-200">{PRODUCT_LABELS[row.product] ?? row.product}</td>
                  <td>{row.count}</td>
                  <td>{formatMoney(row.sum, row.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl text-silver-100">Последние покупки</h2>
            <Link href="/admin/purchases" className="text-sm text-gold-300 hover:underline">
              Все
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-white/5 rounded-xl border border-white/10 text-sm">
            {stats.recentPurchases.length === 0 && <li className="px-4 py-3 text-silver-500">Пока нет.</li>}
            {stats.recentPurchases.map((purchase) => (
              <li key={purchase.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div className="min-w-0">
                  <Link href={`/admin/users/${purchase.user.id}`} className="block truncate text-gold-300 hover:underline">
                    {userLabel(purchase.user)}
                  </Link>
                  <p className="text-xs text-silver-500">
                    {PRODUCT_LABELS[purchase.product] ?? purchase.product} · {formatDateTime(purchase.createdAt)}
                  </p>
                </div>
                <p className="text-right text-silver-200">
                  {formatMoney(purchase.amount, purchase.currency)}
                  <span className="block text-xs text-silver-500">{STATUS_LABELS[purchase.status] ?? purchase.status}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl text-silver-100">Новые пользователи</h2>
            <Link href="/admin/users" className="text-sm text-gold-300 hover:underline">
              Все
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-white/5 rounded-xl border border-white/10 text-sm">
            {stats.recentUsers.map((user) => (
              <li key={user.id} className="flex items-center justify-between gap-2 px-4 py-3">
                <Link href={`/admin/users/${user.id}`} className="min-w-0 truncate text-gold-300 hover:underline">
                  {userLabel(user)}
                </Link>
                <span className="shrink-0 text-xs text-silver-500">{formatDateTime(user.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
