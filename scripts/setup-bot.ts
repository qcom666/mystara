// Настройка бота одной командой: `npm run bot:setup` (проверка без отправки: `npm run bot:setup -- --dry-run`).
// Читает TELEGRAM_BOT_TOKEN и NEXT_PUBLIC_SITE_URL из окружения; с флагом `--webhook` ещё регистрирует вебхук
// по TELEGRAM_WEBHOOK_SECRET. Токен нигде не печатается. Если ключи в Vercel скрытые (Sensitive) и локально их
// нет, то же самое делает кнопка «Обновить настройки бота» на главной странице админ-панели.
import { applyBotSetupRequests, buildBotSetupRequests } from "../src/lib/telegram/bot-setup";

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has("--dry-run");
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const webhookSecret = args.has("--webhook") ? process.env.TELEGRAM_WEBHOOK_SECRET : undefined;

  if (!siteUrl) throw new Error("Задайте NEXT_PUBLIC_SITE_URL (например https://example.ru).");
  if (args.has("--webhook") && !webhookSecret) throw new Error("Для --webhook задайте TELEGRAM_WEBHOOK_SECRET.");
  if (!dryRun && !botToken) throw new Error("Задайте TELEGRAM_BOT_TOKEN (токен из @BotFather).");

  const requests = buildBotSetupRequests({ siteUrl, webhookSecret });
  if (dryRun) {
    for (const request of requests) console.log(`[проверка] ${request.method}${request.body.language_code ? ` (${String(request.body.language_code)})` : ""}`);
    return;
  }
  const results = await applyBotSetupRequests(botToken as string, requests);
  for (const result of results) {
    if (result.ok) console.log(`✓ ${result.label}`);
    else console.error(`✗ ${result.label}: ${result.error}`);
  }
  if (results.some((result) => !result.ok)) process.exit(1);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
