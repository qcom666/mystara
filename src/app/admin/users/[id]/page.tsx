import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDateTime, formatMoney, PRODUCT_LABELS, STATUS_LABELS, userLabel } from "@/components/admin/format";
import { UserActions } from "@/components/admin/user-actions";
import { GlassPanel } from "@/components/ui/glass-panel";
import { requireAdmin } from "@/lib/admin-guard";
import { getUserDetail } from "@/lib/repositories/admin.repository";
import { isPremiumActive } from "@/modules/subscriptions/premium";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

const ACTION_LABELS: Record<string, string> = {
  "credits.adjust": "Кредиты",
  "premium.extend": "Premium: продление",
  "premium.end": "Premium: прекращение",
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-2.5 sm:flex-row sm:gap-6">
      <dt className="w-44 shrink-0 text-silver-500">{label}</dt>
      <dd className="min-w-0 break-words text-silver-200">{children}</dd>
    </div>
  );
}

export default async function AdminUserPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const detail = await getUserDetail(id);
  if (!detail) notFound();

  const { user, purchases, natalCharts, actions } = detail;
  const premiumActive = isPremiumActive(user.subscription, new Date());

  return (
    <div className="space-y-10">
      <div>
        <Link href="/admin/users" className="text-sm text-gold-300 hover:underline">
          ← Все пользователи
        </Link>
        <h1 className="mt-2 font-display text-2xl text-silver-50">{userLabel(user)}</h1>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <dl className="divide-y divide-white/5 self-start rounded-xl border border-white/10 text-sm">
          <Row label="ID аккаунта">
            <code className="text-xs">{user.id}</code>
          </Row>
          <Row label="Имя">{user.name ?? "—"}</Row>
          <Row label="E-mail">{user.email ?? "—"}</Row>
          <Row label="Telegram">{user.telegramUsername ? `@${user.telegramUsername}` : "—"}</Row>
          <Row label="Telegram ID">{user.telegramId ?? "—"}</Row>
          <Row label="Регистрация">{formatDateTime(user.createdAt)}</Row>
          <Row label="Согласие на данные">
            {user.privacyConsentAt ? `${formatDateTime(user.privacyConsentAt)} (версия ${user.privacyPolicyVersion ?? "?"})` : "нет записи"}
          </Row>
          <Row label="Кредиты карт">{user.natalChartCredits}</Row>
          <Row label="Premium">
            {premiumActive ? `активен до ${formatDateTime(user.subscription?.currentPeriodEnd ?? null)}` : "не действует"}
            {user.subscription?.provider && <span className="ml-2 text-xs text-silver-500">({user.subscription.provider})</span>}
          </Row>
          <Row label="Объём данных">
            расклады: {user._count.readings}, натальные карты: {user._count.natalChartReadings}, избранное: {user._count.favorites}
          </Row>
        </dl>

        <GlassPanel>
          <h2 className="font-display text-lg text-silver-100">Действия</h2>
          <div className="mt-4">
            <UserActions userId={user.id} />
          </div>
        </GlassPanel>
      </section>

      <section>
        <h2 className="font-display text-xl text-silver-100">Покупки</h2>
        <ul className="mt-3 divide-y divide-white/5 rounded-xl border border-white/10 text-sm">
          {purchases.length === 0 && <li className="px-4 py-3 text-silver-500">Покупок нет.</li>}
          {purchases.map((purchase) => (
            <li key={purchase.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <p className="text-silver-100">{PRODUCT_LABELS[purchase.product] ?? purchase.product}</p>
                <p className="text-xs text-silver-500">
                  {formatDateTime(purchase.createdAt)} · {purchase.provider ?? "—"}
                  {purchase.externalId ? ` · ${purchase.externalId}` : ""}
                </p>
              </div>
              <p className="text-right text-silver-200">
                {formatMoney(purchase.amount, purchase.currency)}
                <span className="block text-xs text-silver-500">{STATUS_LABELS[purchase.status] ?? purchase.status}</span>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-xl text-silver-100">Натальные карты</h2>
          <ul className="mt-3 divide-y divide-white/5 rounded-xl border border-white/10 text-sm">
            {natalCharts.length === 0 && <li className="px-4 py-3 text-silver-500">Нет.</li>}
            {natalCharts.map((chart) => (
              <li key={chart.id} className="flex items-center justify-between gap-2 px-4 py-3">
                <span className="text-silver-200">{chart.birthPlace ?? "место не указано"}</span>
                <span className="shrink-0 text-xs text-silver-500">
                  {formatDateTime(chart.createdAt)} · {chart.source === "premium" ? "по Premium" : "за кредит"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-display text-xl text-silver-100">Журнал действий</h2>
          <ul className="mt-3 divide-y divide-white/5 rounded-xl border border-white/10 text-sm">
            {actions.length === 0 && <li className="px-4 py-3 text-silver-500">Ручных действий не было.</li>}
            {actions.map((action) => {
              const details = action.details as { reason?: string; delta?: number; days?: number } | null;
              return (
                <li key={action.id} className="px-4 py-3">
                  <p className="text-silver-100">
                    {ACTION_LABELS[action.action] ?? action.action}
                    {typeof details?.delta === "number" && ` ${details.delta > 0 ? "+" : ""}${details.delta}`}
                    {typeof details?.days === "number" && ` +${details.days} дн.`}
                  </p>
                  <p className="text-xs text-silver-500">
                    {formatDateTime(action.createdAt)} · {details?.reason ?? ""}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}
