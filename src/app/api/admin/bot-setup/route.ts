import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/site-url";
import { applyBotSetupRequests, buildBotSetupRequests, fetchWebhookInfo } from "@/lib/telegram/bot-setup";

export const dynamic = "force-dynamic";

/**
 * Настройка бота с сервера, ключами из окружения Vercel: команды, описания, кнопка меню и вебхук (тот же
 * набор, что `npm run bot:setup -- --webhook`). Нужна, потому что скрытые (Sensitive) переменные Vercel нельзя
 * скачать на компьютер. GET показывает текущее состояние вебхука, POST применяет настройки.
 * Не-администраторам отвечает 404, как и остальные админ-маршруты; токен и секрет в ответ не попадают.
 */
function configuration(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const siteUrl = getSiteUrl(request);
  return { botToken, webhookSecret, siteUrl };
}

export async function GET(request: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const { botToken, webhookSecret, siteUrl } = configuration(request);
  if (!botToken) return NextResponse.json({ error: "bot_token_missing" }, { status: 503 });
  return NextResponse.json({ siteUrl, webhookSecretConfigured: Boolean(webhookSecret), webhook: await fetchWebhookInfo(botToken) });
}

export async function POST(request: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const { botToken, webhookSecret, siteUrl } = configuration(request);
  if (!botToken || !webhookSecret) return NextResponse.json({ error: "bot_not_configured" }, { status: 503 });
  // Telegram принимает кнопку Mini App и вебхук только по https.
  if (!siteUrl.startsWith("https://")) return NextResponse.json({ error: "https_required", siteUrl }, { status: 400 });

  const results = await applyBotSetupRequests(botToken, buildBotSetupRequests({ siteUrl, webhookSecret }));
  await prisma.adminAction.create({
    data: { adminId: admin.id, action: "bot.setup", details: { siteUrl, results: results.map((result) => ({ label: result.label, ok: result.ok, error: result.error })) } },
  });
  return NextResponse.json({ siteUrl, results, webhook: await fetchWebhookInfo(botToken) });
}
