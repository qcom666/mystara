import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { enforceKeyedRateLimit, enforceRateLimit } from "@/lib/rate-limit";
import { redeemPromoCode } from "@/lib/repositories/promo.repository";

const bodySchema = z.object({ code: z.string().min(1).max(40) });

/** Активация промокода текущим пользователем. Частота ограничена, чтобы коды нельзя было перебирать. */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "promo-redeem", { limit: 10, windowSeconds: 3600 });
  if (limited) return limited;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "db_not_configured" }, { status: 503 });

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  // Отдельный лимит на аккаунт: смена IP не даёт перебирать коды быстрее.
  const perUser = enforceKeyedRateLimit("promo-redeem-user", session.user.id, { limit: 10, windowSeconds: 3600 });
  if (perUser) return perUser;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_code" }, { status: 400 });

  const result = await redeemPromoCode(session.user.id, parsed.data.code);
  if (result.ok) return NextResponse.json(result);
  return NextResponse.json({ error: result.error }, { status: result.error === "not_found" || result.error === "invalid_code" ? 404 : 409 });
}
