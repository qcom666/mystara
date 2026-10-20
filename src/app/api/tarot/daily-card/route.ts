import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { logError } from "@/lib/logger";
import { findTelegramIdByUserId } from "@/lib/repositories/telegram-user.repository";
import { dailyCard, type DailyCardKind, type DailyCardPayload, GUEST_DAILY_SUBJECT, moscowDay } from "@/modules/tarot/services/daily-card";

export const dynamic = "force-dynamic";

/**
 * Карта дня для страницы /tarot/card-of-the-day. Считается на сервере, чтобы личная карта не зависела от
 * устройства: у аккаунта с привязанным Telegram — по Telegram ID (так же выбирает бот, chat id личного чата
 * равен ID пользователя), у остальных вошедших — по ID аккаунта, у гостей — общая карта дня.
 */
export async function GET() {
  const day = moscowDay();
  const userId = (await auth())?.user?.id;

  let subject = GUEST_DAILY_SUBJECT;
  let kind: DailyCardKind = "guest";
  if (userId) {
    subject = `user:${userId}`;
    kind = "account";
    if (isDatabaseConfigured()) {
      try {
        const telegramId = await findTelegramIdByUserId(userId);
        if (telegramId) {
          subject = telegramId;
          kind = "telegram";
        }
      } catch (error) {
        logError("daily-card-page", error);
      }
    }
  }

  const daily = dailyCard(subject, day);
  const payload: DailyCardPayload = { day, cardId: daily.card.id, orientation: daily.orientation, kind };
  return NextResponse.json(payload, { headers: { "Cache-Control": "private, no-store" } });
}
