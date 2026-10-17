import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { starsSyncAllowed } from "@/lib/payments/payment-sync";
import { syncPendingStarPurchases } from "@/lib/payments/stars-sync";
import { syncPendingYooKassaPurchases } from "@/lib/payments/yookassa-sync";
import { enforceKeyedRateLimit } from "@/lib/rate-limit";
import { getPurchaseStatusForUser } from "@/lib/repositories/purchase.repository";

const bodySchema = z.object({ purchaseId: z.string().min(1).max(64) });

/**
 * Прошла ли оплата покупки. Для ЮKassa статус платежа сначала проверяется у самой ЮKassa и оплаченное
 * сразу выдаётся (не дожидаясь уведомления). Оплату Звёздами обычно подтверждает вебхук бота; если его
 * нет дольше нескольких секунд, оплата ищется в истории транзакций бота (не чаще раза в 10 секунд на
 * покупку). Экран «подтверждаем оплату» опрашивает этот маршрут, пока статус не станет paid или failed.
 */
export async function POST(request: Request) {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "db_not_configured" }, { status: 503 });
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const limited = enforceKeyedRateLimit("payment-confirm", session.user.id, { limit: 60, windowSeconds: 60 });
  if (limited) return limited;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const purchase = await getPurchaseStatusForUser(parsed.data.purchaseId, session.user.id);
  if (!purchase) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (purchase.status === "pending" && purchase.provider === "yookassa") {
    await syncPendingYooKassaPurchases({ userId: session.user.id, purchaseId: parsed.data.purchaseId, maxAgeHours: 72, limit: 1 });
  }
  if (purchase.status === "pending" && purchase.provider === "stars" && starsSyncAllowed(`purchase:${parsed.data.purchaseId}`, 10)) {
    await syncPendingStarPurchases({ userId: session.user.id, purchaseId: parsed.data.purchaseId, maxAgeHours: 72, limit: 1 });
  }
  const current = purchase.status === "pending" ? await getPurchaseStatusForUser(parsed.data.purchaseId, session.user.id) : purchase;
  return NextResponse.json({ status: current?.status ?? purchase.status, product: purchase.product });
}
