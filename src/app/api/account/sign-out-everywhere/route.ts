import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { revokeAllSessions } from "@/lib/repositories/account-deletion.repository";

/** Завершает все сессии пользователя на всех устройствах, включая текущую. */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "sign-out-everywhere", { limit: 10, windowSeconds: 3600 });
  if (limited) return limited;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "db_not_configured" }, { status: 503 });

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await revokeAllSessions(session.user.id);
  return NextResponse.json({ ok: true });
}
