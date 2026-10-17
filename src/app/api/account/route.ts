import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { cancelUserStarSubscriptions } from "@/lib/payments/star-subscriptions";
import { deleteAccountData } from "@/lib/repositories/account-deletion.repository";
import { enforceRateLimit } from "@/lib/rate-limit";

const deleteAccountSchema = z.object({ confirm: z.literal(true) });

/**
 * Удаление аккаунта и личных данных самим пользователем (он же отзыв согласия). Действие необратимо,
 * поэтому тело запроса должно явно содержать `{ "confirm": true }`. Сначала отключается автопродление подписки
 * Звёздами: иначе Telegram продолжал бы списывать оплату за аккаунт, которого нет. Если Telegram недоступен,
 * аккаунт не удаляется (ответ 502), чтобы можно было повторить.
 */
export async function DELETE(request: Request) {
  const limited = enforceRateLimit(request, "account-delete", { limit: 5, windowSeconds: 3600 });
  if (limited) return limited;
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "db_not_configured" }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = deleteAccountSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const { result } = await cancelUserStarSubscriptions(session.user.id);
  if (result === "unavailable") {
    return NextResponse.json({ error: "auto_renew_cancel_failed" }, { status: 502 });
  }

  const deleted = await deleteAccountData(session.user.id);
  if (!deleted) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
