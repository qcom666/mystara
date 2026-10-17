import { logError } from "@/lib/logger";
import { getMailer, type Mailer } from "@/lib/mail/mailer";
import { renewalReminderMessage } from "@/lib/mail/templates";
import { listSubscriptionsToRemind, markRenewalReminded } from "@/lib/repositories/subscription.repository";
import { sendBotMessage } from "@/lib/telegram/bot-api";

/**
 * Напоминание о продлении Premium за 3 дня до конца срока. Без автопродления (разовая оплата, на сайте, или
 * подписка Звёздами с отключённым продлением) Premium молча заканчивается; тем, у кого автопродление включено,
 * напоминание не шлётся (см. listSubscriptionsToRemind). Пишем в Telegram (если аккаунт связан и бот может писать)
 * и на почту (если она есть и настроен SMTP). О каждом сроке напоминаем один раз; при временной ошибке доставки
 * попробуем на следующий день.
 */

export const REMIND_DAYS_BEFORE = 3;
const SEND_INTERVAL_MS = 40;

const COPY = {
  ru: {
    text: (date: string) =>
      `⏳ Premium в Mystara действует до ${date}, автопродление не включено. Чтобы не потерять безлимитные расклады и натальную карту раз в неделю, продлите заранее — оставшиеся дни сохранятся и сложатся с новыми. В Telegram можно оформить Premium с автопродлением.`,
    button: "Продлить Premium",
    locale: "ru-RU",
  },
  en: {
    text: (date: string) =>
      `⏳ Your Mystara Premium is active until ${date} and auto-renewal is off. Renew in advance to keep unlimited readings and a weekly Natal Chart — the days you have left carry over. In Telegram you can get Premium with auto-renewal.`,
    button: "Renew Premium",
    locale: "en-GB",
  },
} as const;

const formatDate = (date: Date, locale: string) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: "Europe/Moscow" }).format(date);

export function renewalReminderText(periodEnd: Date, lang: "ru" | "en"): string {
  return COPY[lang].text(formatDate(periodEnd, COPY[lang].locale));
}

export interface ReminderSummary {
  telegram: number;
  email: number;
  unreachable: number;
  retryLater: number;
}

export async function sendRenewalReminders(
  now: Date,
  options: { siteUrl: string; limit: number; botToken?: string; mailer?: Mailer | null; fetchImpl?: typeof fetch; pauseMs?: number },
): Promise<ReminderSummary> {
  const until = new Date(now.getTime() + REMIND_DAYS_BEFORE * 86_400_000);
  const rows = await listSubscriptionsToRemind(now, until, options.limit);
  const mailer = options.mailer === undefined ? getMailer() : options.mailer;
  const summary: ReminderSummary = { telegram: 0, email: 0, unreachable: 0, retryLater: 0 };

  for (const row of rows) {
    if (!row.currentPeriodEnd) continue;
    const lang = row.user.language?.toLowerCase().startsWith("ru") ? "ru" : "en";
    let delivered = false;
    let temporaryFailure = false;

    if (options.botToken && row.user.telegramId) {
      const pricing = `${options.siteUrl}/pricing`;
      const markup = pricing.startsWith("https://") ? { inline_keyboard: [[{ text: COPY[lang].button, web_app: { url: pricing } }]] } : undefined;
      const status = await sendBotMessage(options.botToken, row.user.telegramId, renewalReminderText(row.currentPeriodEnd, lang), markup, options.fetchImpl);
      if (status === 200) {
        delivered = true;
        summary.telegram += 1;
      } else if (status === null || status === 429 || status >= 500) {
        temporaryFailure = true;
      }
      await new Promise((resolve) => setTimeout(resolve, options.pauseMs ?? SEND_INTERVAL_MS));
    }

    if (mailer && row.user.email) {
      try {
        await mailer.send(
          renewalReminderMessage(row.user.email, {
            dateRu: formatDate(row.currentPeriodEnd, "ru-RU"),
            dateEn: formatDate(row.currentPeriodEnd, "en-GB"),
            linkRu: `${options.siteUrl}/ru/pricing`,
            linkEn: `${options.siteUrl}/pricing`,
          }),
        );
        delivered = true;
        summary.email += 1;
      } catch (error) {
        temporaryFailure = true;
        logError("renewal-reminder", error);
      }
    }

    if (delivered || !temporaryFailure) {
      // Доставлено или связаться нельзя вовсе (нет каналов, бот заблокирован): больше об этом сроке не пишем.
      if (!delivered) summary.unreachable += 1;
      await markRenewalReminded(row.userId, row.currentPeriodEnd);
    } else {
      summary.retryLater += 1;
    }
  }
  return summary;
}
