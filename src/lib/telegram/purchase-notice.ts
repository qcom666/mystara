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
  /** Повторное списание по подписке с автопродлением. */
  renewal?: boolean;
  /** Когда пройдёт следующее списание по подписке; null, если автопродления нет или оно отключено. */
  nextChargeAt?: Date | null;
}

const COPY = {
  ru: {
    premium: (date: string) => `✨ Оплата прошла. Premium активен до ${date}: безлимитные расклады, все расклады и натальная карта раз в неделю.`,
    renewed: (date: string) => `✨ Premium продлён до ${date}: подписка оплачена ещё на 30 дней.`,
    nextCharge: (date: string) => ` Автопродление включено: следующее списание ${date}, отключить его можно в личном кабинете или в настройках Telegram.`,
    pack: (granted: number, total: number) => `✨ Оплата прошла. Начислено кредитов натальной карты: ${granted}. Всего на счету: ${total}.`,
    // Дата по-русски уже кончается на «г.»: точку после неё не ставим.
    canceled: (until: string) => `Автопродление Premium отключено, новых списаний не будет. Оплаченный Premium действует до ${until}`,
    resumed: (next: string) => `Автопродление Premium снова включено, следующее списание — ${next}`,
    failed: "Не удалось списать Звёзды за продление Premium: возможно, на балансе их не хватило. Оформить Premium снова можно на странице тарифов.",
    open: "Открыть Mystara",
    pricing: "Тарифы",
    locale: "ru-RU",
  },
  en: {
    premium: (date: string) => `✨ Payment received. Premium is active until ${date}: unlimited readings, every spread and a Natal Chart every week.`,
    renewed: (date: string) => `✨ Premium renewed until ${date}: your subscription is paid for another 30 days.`,
    nextCharge: (date: string) => ` Auto-renewal is on, the next charge is on ${date}. You can turn it off in your account or in Telegram settings.`,
    pack: (granted: number, total: number) => `✨ Payment received. Natal Chart credits added: ${granted}. Balance: ${total}.`,
    canceled: (until: string) => `Premium auto-renewal is off: there will be no more charges. The Premium you paid for stays active until ${until}.`,
    resumed: (next: string) => `Premium auto-renewal is back on. The next charge is on ${next}.`,
    failed: "We couldn't charge Stars to renew Premium — your balance may have been too low. You can get Premium again on the pricing page.",
    open: "Open Mystara",
    pricing: "Pricing",
    locale: "en-GB",
  },
} as const;

const formatDate = (date: Date, locale: string) =>
  new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Moscow" }).format(date);

export function purchaseNoticeText(details: PurchaseNoticeDetails, lang: BotLang): string {
  const copy = COPY[lang];
  if (details.product === "premium_month" && details.premiumUntil) {
    const date = formatDate(details.premiumUntil, copy.locale);
    const text = details.renewal ? copy.renewed(date) : copy.premium(date);
    return details.nextChargeAt ? `${text}${copy.nextCharge(formatDate(details.nextChargeAt, copy.locale))}` : text;
  }
  return copy.pack(details.creditsGranted, details.credits);
}

/** Подтверждение пользователю, что продление подписки отключено, снова включено или списание не прошло. */
export function subscriptionStateText(
  state: "active" | "canceled" | "failed",
  details: { premiumUntil: Date | null; nextChargeAt: Date },
  lang: BotLang,
): string {
  const copy = COPY[lang];
  if (state === "failed") return copy.failed;
  if (state === "active") return copy.resumed(formatDate(details.nextChargeAt, copy.locale));
  return copy.canceled(formatDate(details.premiumUntil ?? details.nextChargeAt, copy.locale));
}

export function subscriptionStateKeyboard(lang: BotLang, appUrl: string) {
  return { inline_keyboard: [[{ text: COPY[lang].pricing, web_app: { url: `${appUrl}/pricing` } }]] };
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
