import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { syncUserPaymentsQuietly } from "@/lib/payments/payment-sync";
import { getAutoRenewView } from "@/lib/repositories/star-subscription.repository";
import { getPremiumState } from "@/lib/repositories/subscription.repository";

/**
 * Состояние подписки Premium вошедшего пользователя: действует ли она, до какого числа, свободна ли недельная
 * натальная карта и включено ли автопродление (подписка Звёздами в Telegram).
 */
export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "db_not_configured", message: "Persistence isn't configured yet." }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Недавняя оплата картой засчитывается сразу, даже если уведомление ЮKassa ещё не пришло.
  await syncUserPaymentsQuietly(session.user.id);
  const [state, autoRenew] = await Promise.all([getPremiumState(session.user.id), getAutoRenewView(session.user.id)]);
  return NextResponse.json({
    active: state.planTier === "premium",
    fullAccess: state.fullAccess,
    currentPeriodEnd: state.currentPeriodEnd,
    freeChartAvailable: state.natalChartWeekly.available,
    nextFreeChartAt: state.natalChartWeekly.nextAvailableAt,
    autoRenew,
  });
}
