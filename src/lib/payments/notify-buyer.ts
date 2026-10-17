import { getFulfilledPurchaseSummary } from "@/lib/repositories/purchase.repository";
import { getSiteUrl } from "@/lib/site-url";
import { sendPurchaseNotice } from "@/lib/telegram/purchase-notice";

/**
 * Сообщение покупателю от бота после выдачи оплаченного (если аккаунт связан с Telegram). Нужен для
 * оплат, подтверждённых не вебхуком бота: картой и сверкой Звёзд. Лучшее усилие: на результат оплаты не влияет.
 */
export async function notifyBuyer(purchaseId: string): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;
  const summary = await getFulfilledPurchaseSummary(purchaseId).catch(() => null);
  if (!summary?.telegramId) return;
  await sendPurchaseNotice({
    botToken,
    chatId: summary.telegramId,
    lang: summary.language?.toLowerCase().startsWith("ru") ? "ru" : "en",
    appUrl: getSiteUrl(),
    details: summary,
  });
}
