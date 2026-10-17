import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { cancelUserStarSubscriptions } from "@/lib/payments/star-subscriptions";
import { enforceKeyedRateLimit } from "@/lib/rate-limit";
import { hasActiveStarSubscription } from "@/lib/repositories/star-subscription.repository";

/**
 * Отключение автопродления Premium (подписки Звёздами) кнопкой в кабинете: бот просит Telegram больше не списывать
 * оплату (editUserStarSubscription). Оплаченный срок дослуживает до конца. Работает и с сайта: Telegram для этого
 * не нужен самому пользователю.
 */
export async function DELETE() {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "db_not_configured" }, { status: 503 });
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const limited = enforceKeyedRateLimit("auto-renew-cancel", session.user.id, { limit: 10, windowSeconds: 3600 });
  if (limited) return limited;

  if (!(await hasActiveStarSubscription(session.user.id))) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const { result } = await cancelUserStarSubscriptions(session.user.id);
  if (result === "ok") return NextResponse.json({ ok: true });
  // Telegram отказал по существу (например, подписку уже отключили в Telegram): отключить её можно там же.
  if (result === "rejected") return NextResponse.json({ error: "cancel_rejected" }, { status: 409 });
  return NextResponse.json({ error: "telegram_unavailable" }, { status: 502 });
}
