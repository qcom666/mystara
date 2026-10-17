import { formatDateTime } from "@/components/admin/format";
import { PromoAdmin } from "@/components/admin/promo-admin";
import { requireAdmin } from "@/lib/admin-guard";
import { listPromoCodes } from "@/lib/repositories/promo.repository";

export const dynamic = "force-dynamic";

/** Промокоды: создание, список с использованием и отключение. */
export default async function AdminPromoPage() {
  await requireAdmin();
  const codes = await listPromoCodes();
  return (
    <PromoAdmin
      codes={codes.map((code) => ({
        id: code.id,
        code: code.code,
        kind: code.kind,
        amount: code.amount,
        used: code.redemptionsCount,
        max: code.maxRedemptions,
        expires: code.expiresAt ? formatDateTime(code.expiresAt) : null,
        active: code.active,
        note: code.note,
      }))}
    />
  );
}
