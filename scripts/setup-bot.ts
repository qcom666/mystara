// Настройка бота одной командой: `npm run bot:setup` (проверка без отправки: `npm run bot:setup -- --dry-run`).
// Читает TELEGRAM_BOT_TOKEN и NEXT_PUBLIC_SITE_URL из окружения; с флагом `--webhook` ещё регистрирует вебхук
// по TELEGRAM_WEBHOOK_SECRET. Токен нигде не печатается.
import { buildBotSetupRequests } from "../src/lib/telegram/bot-setup";

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
  let failed = 0;
  for (const request of requests) {
    const label = `${request.method}${request.body.language_code ? ` (${String(request.body.language_code)})` : ""}`;
    if (dryRun) {
      console.log(`[проверка] ${label}`);
      continue;
    }
    const response = await fetch(`https://api.telegram.org/bot${botToken}/${request.method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request.body),
    });
    const data = (await response.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
    if (response.ok && data?.ok) console.log(`✓ ${label}`);
    else {
      failed += 1;
      console.error(`✗ ${label}: ${data?.description ?? response.status}`);
    }
  }
  if (failed > 0) process.exit(1);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
