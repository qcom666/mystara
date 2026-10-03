import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { buildBotReply, type TelegramUpdate } from "@/lib/telegram/bot-reply";

/**
 * Telegram bot webhook. Telegram POSTs every update here once it's registered with
 * `setWebhook` (see TELEGRAM_SETUP.md) and echoes our secret in the
 * `X-Telegram-Bot-Api-Secret-Token` header — without a match the request is rejected,
 * so only Telegram can drive the bot. Fails closed when the secret isn't configured.
 *
 * The reply goes back as the response body (Telegram runs a `method` returned there),
 * so this route needs no bot token and makes no outgoing requests.
 */

function secretMatches(received: string | null, expected: string): boolean {
  if (!received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 503 });
  }
  if (!secretMatches(request.headers.get("x-telegram-bot-api-secret-token"), secret)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const update = (await request.json().catch(() => null)) as TelegramUpdate | null;
  // The Mini App opens from the same origin Telegram just called, so the button always points at this deployment.
  const reply = update ? buildBotReply(update, new URL(request.url).origin) : null;

  // Always 200 — a non-2xx makes Telegram retry the same update.
  return NextResponse.json(reply ?? { ok: true });
}
