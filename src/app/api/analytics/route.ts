import { NextResponse } from "next/server";
import { recordEvent } from "@/lib/analytics-store";
import { enforceRateLimit } from "@/lib/rate-limit";

/**
 * Приём обезличенных событий из браузера (navigator.sendBeacon). Тело: { event, shell, locale }. Всё, что
 * не входит в белый список (lib/analytics-events.ts), отбрасывается. Всегда отвечает 204: браузеру не о чем
 * сообщать пользователю.
 */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "analytics", { limit: 120, windowSeconds: 60 });
  if (limited) return limited;

  const body = (await request.json().catch(() => null)) as { event?: unknown; shell?: unknown; locale?: unknown } | null;
  if (body) {
    await recordEvent(body.event, {
      shell: body.shell === "telegram" ? "telegram" : "web",
      locale: body.locale === "en" ? "en" : body.locale === "ru" ? "ru" : undefined,
    });
  }
  return new NextResponse(null, { status: 204 });
}
