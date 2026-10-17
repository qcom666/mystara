import { NextResponse } from "next/server";
import { cronAuthorized as authorized } from "@/lib/cron-auth";
import { isDatabaseConfigured } from "@/lib/db";
import { logError } from "@/lib/logger";
import { listDailyCardRecipients, markDailyCardSent, markSubscriberBlocked } from "@/lib/repositories/bot-subscriber.repository";
import { dailyCardKeyboard, dailyCardText, type BotLang } from "@/lib/telegram/daily-card-message";
import { getSiteUrl } from "@/lib/site-url";
import { dailyCard, moscowDay } from "@/modules/tarot/services/daily-card";
import { telegramApiUrl } from "@/lib/telegram/bot-api";

// Рассылка идёт дольше обычного запроса: до минуты (предел тарифа Hobby).
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/** Telegram разрешает боту около 30 сообщений в секунду; держимся с запасом. */
const SEND_INTERVAL_MS = 40;
/** Сколько времени тратим на рассылку за один запуск, оставляя запас до предела функции. */
const TIME_BUDGET_MS = 50_000;
const BATCH = 200;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Утренняя «Карта дня» подписчикам бота. Запускается планировщиком Vercel (vercel.json → crons), который
 * присылает `Authorization: Bearer <CRON_SECRET>`. Без CRON_SECRET маршрут закрыт: так посторонний не
 * сможет запустить рассылку. Каждому отправляется одна карта в сутки (по московскому дню), повторный запуск
 * в тот же день продолжает с тех, кому ещё не отправлено.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!secret || !botToken || !isDatabaseConfigured()) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  if (!authorized(request.headers.get("authorization"), secret)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const started = Date.now();
  const day = moscowDay();
  const appUrl = getSiteUrl(request);
  let sent = 0;
  let blocked = 0;
  let failed = 0;
  // Кому уже пробовали отправить в этот запуск: временная ошибка не должна вызывать повтор по кругу.
  const attempted = new Set<string>();

  while (Date.now() - started < TIME_BUDGET_MS) {
    const recipients = (await listDailyCardRecipients(day, BATCH + attempted.size)).filter((item) => !attempted.has(item.chatId));
    if (recipients.length === 0) break;

    for (const recipient of recipients) {
      if (Date.now() - started >= TIME_BUDGET_MS) break;
      attempted.add(recipient.chatId);
      const lang: BotLang = recipient.language === "en" ? "en" : "ru";
      const daily = dailyCard(recipient.chatId, day);
      try {
        const response = await fetch(telegramApiUrl(botToken, "sendMessage"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: recipient.chatId, text: dailyCardText(daily, lang), reply_markup: dailyCardKeyboard(lang, appUrl, daily.card.id) }),
        });
        if (response.ok) {
          await markDailyCardSent(recipient.chatId, day);
          sent += 1;
        } else if (response.status === 403 || response.status === 400) {
          // 403: бот заблокирован; 400: чата больше нет. Больше не пишем этому подписчику.
          await markSubscriberBlocked(recipient.chatId);
          blocked += 1;
        } else {
          // Остальные ошибки (429 и т. п.) не отмечаем: подписчик получит карту при следующем запуске.
          failed += 1;
        }
      } catch (error) {
        failed += 1;
        logError("daily-card", error);
      }
      await sleep(SEND_INTERVAL_MS);
    }
  }

  return NextResponse.json({ ok: true, day, sent, blocked, failed });
}
