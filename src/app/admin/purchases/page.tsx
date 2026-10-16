import Link from "next/link";
import { RefundButton } from "@/components/admin/refund-button";
import { formatDateTime, formatMoney, PRODUCT_LABELS, STATUS_LABELS, userLabel } from "@/components/admin/format";
import { requireAdmin } from "@/lib/admin-guard";
import { listPurchases } from "@/lib/repositories/admin.repository";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

const FILTERS = [
  { value: "", label: "Все" },
  { value: "paid", label: "Оплаченные" },
  { value: "pending", label: "Ожидают оплаты" },
  { value: "failed", label: "Не прошли" },
  { value: "refunded", label: "Возвраты" },
];

export default async function AdminPurchasesPage({ searchParams }: PageProps) {
  await requireAdmin();
  const { status = "" } = await searchParams;
  const selected = FILTERS.some((filter) => filter.value === status) ? status : "";
  const purchases = await listPurchases({ status: selected || undefined });

  return (
    <div>
      <h1 className="font-display text-2xl text-silver-50">Покупки</h1>

      <nav className="mt-4 flex flex-wrap gap-2 text-sm">
        {FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={filter.value ? `/admin/purchases?status=${filter.value}` : "/admin/purchases"}
            className={`rounded-full border px-3 py-1 ${
              selected === filter.value ? "border-gold-400 text-gold-300" : "border-white/10 text-silver-400 hover:text-silver-200"
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </nav>

      <p className="mt-3 text-xs text-silver-500">Последние {purchases.length} (не больше 100).</p>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-silver-500">
            <tr>
              <th className="py-2">Дата</th>
              <th>Пользователь</th>
              <th>Товар</th>
              <th>Способ</th>
              <th>Сумма</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {purchases.length === 0 && (
              <tr>
                <td colSpan={7} className="py-4 text-silver-500">
                  Покупок нет.
                </td>
              </tr>
            )}
            {purchases.map((purchase) => (
              <tr key={purchase.id}>
                <td className="py-2 text-silver-300">{formatDateTime(purchase.createdAt)}</td>
                <td>
                  <Link href={`/admin/users/${purchase.user.id}`} className="text-gold-300 hover:underline">
                    {userLabel(purchase.user)}
                  </Link>
                </td>
                <td className="text-silver-200">{PRODUCT_LABELS[purchase.product] ?? purchase.product}</td>
                <td className="text-silver-400">{purchase.provider ?? "—"}</td>
                <td className="text-silver-200">{formatMoney(purchase.amount, purchase.currency)}</td>
                <td className="text-silver-400">{STATUS_LABELS[purchase.status] ?? purchase.status}</td>
                <td className="text-right">{purchase.status === "paid" && <RefundButton purchaseId={purchase.id} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
