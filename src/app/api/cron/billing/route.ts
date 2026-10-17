import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { isDatabaseConfigured } from "@/lib/db";
import { logError, logWarning } from "@/lib/logger";
import { sendRenewalReminders } from "@/lib/payments/renewal-reminders";
import { syncPendingStarPurchases } from "@/lib/payments/stars-sync";
import { syncPendingYooKassaPurchases, type PaymentSyncResult } from "@/lib/payments/yookassa-sync";
import { expireStalePendingPurchases } from "@/lib/repositories/purchase.repository";
import { getSiteUrl } from "@/lib/site-url";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/** Брошенный счёт (не оплачен неделю) закрывается как неудавшийся. */
const STALE_PENDING_DAYS = 7;

const count = (results: PaymentSyncResult[]) => results.reduce<Record<string, number>>((acc, result) => ({ ...acc, [result]: (acc[result] ?? 0) + 1 }), {});

/**
 * Ежедневное обслуживание оплат и подписок (vercel.json → crons, нужен CRON_SECRET):
 *  1. сверка неоплаченных покупок ЮKassa и Звёздами за трое суток — оплаченное выдаётся, даже если
 *     уведомление провайдера так и не дошло, отменённое закрывается;
 *  2. брошенные счета старше недели закрываются как неудавшиеся;
 *  3. напоминание о продлении Premium за 3 дня до конца срока (Telegram и почта).
 * Каждый шаг выполняется независимо: сбой одного не мешает остальным.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !isDatabaseConfigured()) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  if (!cronAuthorized(request.headers.get("authorization"), secret)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const now = new Date();
  const report: Record<string, unknown> = {};

  try {
    report.yookassa = count(await syncPendingYooKassaPurchases({ maxAgeHours: 72, limit: 100, now }));
  } catch (error) {
    logError("cron-billing", error, { step: "yookassa" });
  }
  try {
    report.stars = count(await syncPendingStarPurchases({ maxAgeHours: 72, limit: 200, now }));
  } catch (error) {
    logError("cron-billing", error, { step: "stars" });
  }
  try {
    report.expired = await expireStalePendingPurchases(new Date(now.getTime() - STALE_PENDING_DAYS * 86_400_000));
  } catch (error) {
    logError("cron-billing", error, { step: "expire" });
  }
  try {
    report.reminders = await sendRenewalReminders(now, { siteUrl: getSiteUrl(request), limit: 300, botToken: process.env.TELEGRAM_BOT_TOKEN });
  } catch (error) {
    logError("cron-billing", error, { step: "reminders" });
  }

  const fulfilled = ((report.yookassa as Record<string, number> | undefined)?.fulfilled ?? 0) + ((report.stars as Record<string, number> | undefined)?.fulfilled ?? 0);
  if (fulfilled > 0) logWarning("cron-billing", "payments fulfilled by reconciliation, check provider notifications", { fulfilled });
  return NextResponse.json(report);
}
