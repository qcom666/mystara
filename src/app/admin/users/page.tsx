import Link from "next/link";
import { formatDay, userLabel } from "@/components/admin/format";
import { requireAdmin } from "@/lib/admin-guard";
import { searchUsers } from "@/lib/repositories/admin.repository";
import { isPremiumActive } from "@/modules/subscriptions/premium";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  await requireAdmin();
  const { q = "" } = await searchParams;
  const users = await searchUsers(q);
  const now = new Date();

  return (
    <div>
      <h1 className="font-display text-2xl text-silver-50">Пользователи</h1>

      <form className="mt-4 flex gap-2" action="/admin/users" method="get">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="e-mail, имя, @telegram, Telegram ID или ID аккаунта"
          className="w-full max-w-md rounded-lg border border-white/10 bg-midnight-900 px-3 py-2 text-sm text-silver-100 placeholder:text-silver-500"
        />
        <button type="submit" className="rounded-lg border border-gold-500/40 px-4 py-2 text-sm text-gold-300 hover:bg-gold-500/10">
          Найти
        </button>
      </form>

      <p className="mt-3 text-xs text-silver-500">
        {q ? `Найдено: ${users.length}` : `Последние зарегистрированные (до 50)`}
      </p>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-silver-500">
            <tr>
              <th className="py-2">Пользователь</th>
              <th>Регистрация</th>
              <th>Кредиты</th>
              <th>Premium до</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-silver-500">
                  Никого не найдено.
                </td>
              </tr>
            )}
            {users.map((user) => (
              <tr key={user.id}>
                <td className="py-2">
                  <Link href={`/admin/users/${user.id}`} className="text-gold-300 hover:underline">
                    {userLabel(user)}
                  </Link>
                  {user.name && user.email && <span className="ml-2 text-xs text-silver-500">{user.name}</span>}
                </td>
                <td className="text-silver-300">{formatDay(user.createdAt)}</td>
                <td className="text-silver-200">{user.natalChartCredits}</td>
                <td className="text-silver-300">
                  {isPremiumActive(user.subscription, now) ? formatDay(user.subscription?.currentPeriodEnd ?? null) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
