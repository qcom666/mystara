import Link from "next/link";
import { CopyButton } from "@/components/admin/copy-button";
import { ReceiptControl } from "@/components/admin/receipt-control";
import { RefundButton } from "@/components/admin/refund-button";
import { formatDateTime, formatDay, formatMoney, purchaseProductLabel, receiptServiceName, STATUS_LABELS, userLabel } from "@/components/admin/format";
import { requireAdmin } from "@/lib/admin-guard";
import { isMailConfigured } from "@/lib/mail/mailer";
import { isReceiptOverdue, purchasePaidAt, receiptDueDay } from "@/lib/payments/receipts";
import { listPurchases } from "@/lib/repositories/admin.repository";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

const NO_RECEIPT = "no_receipt";

const FILTERS = [
  { value: "", label: "Все" },
  { value: "paid", label: "Оплаченные" },
  { value: NO_RECEIPT, label: "Оплачено, чек не выдан" },
  { value: "pending", label: "Ожидают оплаты" },
  { value: "failed", label: "Не прошли" },
  { value: "refunded", label: "Возвраты" },
];

export default async function AdminPurchasesPage({ searchParams }: PageProps) {
  await requireAdmin();
  const { status = "" } = await searchParams;
  const selected = FILTERS.some((filter) => filter.value === status) ? status : "";
  const withoutReceipt = selected === NO_RECEIPT;
  const purchases = await listPurchases(withoutReceipt ? { withoutReceipt } : { status: selected || undefined });
  const now = new Date();
  const botReady = Boolean(process.env.TELEGRAM_BOT_TOKEN);
  const mailReady = isMailConfigured();

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

      {withoutReceipt ? (
        <p className="mt-3 max-w-3xl text-xs text-silver-500">
          Доход по каждой покупке регистрируется в приложении «Мой налог» (покупатель — физическое лицо), ссылка на чек вставляется сюда и
          отправляется покупателю. Срок по 422-ФЗ — до 9-го числа месяца, следующего за месяцем оплаты. Сначала самые старые, не больше 100.
        </p>
      ) : (
        <p className="mt-3 text-xs text-silver-500">Последние {purchases.length} (не больше 100). У оплаченных покупок указана дата оплаты.</p>
      )}

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
              <th>Чек «Мой налог»</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {purchases.length === 0 && (
              <tr>
                <td colSpan={8} className="py-4 text-silver-500">
                  {withoutReceipt ? "Все чеки выданы." : "Покупок нет."}
                </td>
              </tr>
            )}
            {purchases.map((purchase) => {
              const paid = purchase.status === "paid";
              const paidAt = purchasePaidAt(purchase);
              const channels = [
                ...(botReady && purchase.user.telegramId ? ["telegram"] : []),
                ...(mailReady && purchase.user.email ? ["email"] : []),
              ];
              return (
                <tr key={purchase.id} className="align-top">
                  <td className="whitespace-nowrap py-2 pr-3 text-silver-300">{formatDateTime(paid ? paidAt : purchase.createdAt)}</td>
                  <td className="pr-3 pt-2">
                    <Link href={`/admin/users/${purchase.user.id}`} className="text-gold-300 hover:underline">
                      {userLabel(purchase.user)}
                    </Link>
                  </td>
                  <td className="pr-3 pt-2 text-silver-200">
                    {purchaseProductLabel(purchase)}
                    {paid && (
                      <span className="block">
                        <CopyButton text={receiptServiceName(purchase.product)} label="копировать название" />
                      </span>
                    )}
                  </td>
                  <td className="pr-3 pt-2 text-silver-400">{purchase.provider ?? "—"}</td>
                  <td className="whitespace-nowrap pr-3 pt-2 text-silver-200">{formatMoney(purchase.amount, purchase.currency)}</td>
                  <td className="pr-3 pt-2 text-silver-400">{STATUS_LABELS[purchase.status] ?? purchase.status}</td>
                  <td className="py-2 pr-3">
                    {paid ? (
                      <ReceiptControl
                        purchaseId={purchase.id}
                        receiptUrl={purchase.receiptUrl}
                        sentAt={purchase.receiptSentAt ? formatDateTime(purchase.receiptSentAt) : null}
                        dueDay={formatDay(receiptDueDay(paidAt))}
                        overdue={isReceiptOverdue(paidAt, now)}
                        channels={channels}
                      />
                    ) : purchase.receiptUrl ? (
                      <span className="text-xs text-silver-500">
                        <a href={purchase.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-gold-300 hover:underline">
                          чек
                        </a>
                        {purchase.status === "refunded" && " · после возврата аннулируйте чек в «Мой налог»"}
                      </span>
                    ) : (
                      <span className="text-xs text-silver-500">—</span>
                    )}
                  </td>
                  <td className="pt-2 text-right">{paid && <RefundButton purchaseId={purchase.id} />}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
