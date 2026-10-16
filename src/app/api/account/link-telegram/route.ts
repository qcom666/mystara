import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { linkTelegramToUser } from "@/lib/repositories/account-link.repository";
import { validateTelegramLoginWidget } from "@/lib/telegram/validate-login-widget";

const bodySchema = z.object({ widgetData: z.string().min(2).max(2000) });

/** Привязывает Telegram к текущему аккаунту по подписанным данным виджета «Войти через Telegram». */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "account-link-telegram", { limit: 10, windowSeconds: 3600 });
  if (limited) return limited;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "db_not_configured" }, { status: 503 });

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!botToken || !parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  let payload: Record<string, string>;
  try {
    const raw: unknown = JSON.parse(parsed.data.widgetData);
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) throw new Error("not_object");
    payload = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, String(value)]));
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const result = validateTelegramLoginWidget(payload, botToken);
  if (!result.valid || !result.user) return NextResponse.json({ error: "invalid_signature" }, { status: 400 });

  const outcome = await linkTelegramToUser(session.user.id, result.user);
  if (outcome === "ok") return NextResponse.json({ ok: true });
  return NextResponse.json({ error: outcome }, { status: outcome === "not_found" ? 404 : 409 });
}
