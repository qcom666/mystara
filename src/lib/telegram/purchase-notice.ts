import { logWarning } from "@/lib/logger";
import type { BotLang } from "./daily-card-message";
import { telegramApiUrl } from "./bot-api";

/** Что выдано за оплату: для сообщения покупателю в Telegram. */
export interface PurchaseNoticeDetails {
  product: string;
  creditsGranted: number;
  /** Остаток кредитов натальной карты после начисления. */
  credits: number;
  premiumUntil: Date | null;
}

const COPY = {
  ru: {
    premium: (date: string) => `✨ Оплата прошла. Premium активен до ${date}: безлимитные расклады, все расклады и натальная карта раз в неделю.`,
    pack: (granted: number, total: number) => `✨ Оплата прошла. Начислено кредитов натальной карты: ${granted}. Всего на счету: ${total}.`,
    open: "Открыть Mystara",
    locale: "ru-RU",
  },
  en: {
    premium: (date: string) => `✨ Payment received. Premium is active until ${date}: unlimited readings, every spread and a Natal Chart every week.`,
    pack: (granted: number, total: number) => `✨ Payment received. Natal Chart credits added: ${granted}. Balance: ${total}.`,
    open: "Open Mystara",
    locale: "en-GB",
  },
} as const;

export function purchaseNoticeText(details: PurchaseNoticeDetails, lang: BotLang): string {
  const copy = COPY[lang];
  if (details.product === "premium_month" && details.premiumUntil) {
    const date = new Intl.DateTimeFormat(copy.locale, { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Moscow" }).format(details.premiumUntil);
    return copy.premium(date);
  }
  return copy.pack(details.creditsGranted, details.credits);
}

export function purchaseNoticeKeyboard(lang: BotLang, appUrl: string, product: string) {
  const path = product === "premium_month" ? "/pricing" : "/astrology/natal-chart";
  return { inline_keyboard: [[{ text: COPY[lang].open, web_app: { url: `${appUrl}${path}` } }]] };
}

/**
 * Сообщение покупателю от бота после оплаты на сайте. Лучшее усилие: если пользователь ни разу не писал
 * боту, Telegram откажет (403) — оплата от этого не зависит, поэтому ошибка только пишется в журнал.
 */
export async function sendPurchaseNotice(
  params: { botToken: string; chatId: string; lang: BotLang; appUrl: string; details: PurchaseNoticeDetails },
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  try {
    const response = await fetchImpl(telegramApiUrl(params.botToken, "sendMessage"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: params.chatId,
        text: purchaseNoticeText(params.details, params.lang),
        reply_markup: params.appUrl.startsWith("https://") ? purchaseNoticeKeyboard(params.lang, params.appUrl, params.details.product) : undefined,
      }),
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) logWarning("purchase-notice", "telegram refused the message", { status: String(response.status) });
    return response.ok;
  } catch {
    logWarning("purchase-notice", "telegram request failed");
    return false;
  }
}
