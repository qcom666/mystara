import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { isDatabaseConfigured } from "@/lib/db";
import { logWarning } from "@/lib/logger";
import { syncPendingYooKassaPurchases } from "@/lib/payments/yookassa-sync";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Ежедневная сверка оплат картой (vercel.json → crons): неоплаченные покупки ЮKassa за трое суток
 * проверяются у ЮKassa. Страховка на случай, когда покупатель не вернулся на сайт после оплаты, а
 * уведомление ЮKassa не дошло: оплаченное будет выдано, отменённые платежи закроются.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !isDatabaseConfigured()) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  if (!cronAuthorized(request.headers.get("authorization"), secret)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const results = await syncPendingYooKassaPurchases({ maxAgeHours: 72, limit: 100 });
  const summary = results.reduce<Record<string, number>>((acc, result) => ({ ...acc, [result]: (acc[result] ?? 0) + 1 }), {});
  if (summary.fulfilled) logWarning("reconcile-payments", "payments fulfilled by reconciliation, check YooKassa notifications", { fulfilled: summary.fulfilled });
  return NextResponse.json({ checked: results.length, ...summary });
}
