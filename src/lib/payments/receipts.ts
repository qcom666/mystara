import { getDictionary } from "@/lib/i18n/dictionaries";
import type { MailMessage } from "@/lib/mail/mailer";
import { moscowDay } from "@/modules/tarot/services/daily-card";

/**
 * Чеки самозанятого. ЮKassa чеки за самозанятых не формирует, поэтому каждый доход оператор регистрирует сам
 * в приложении «Мой налог», вносит ссылку на чек в админ-панели и отправляет её покупателю. По 422-ФЗ (ст. 14)
 * при безналичных расчётах чек нужно сформировать и передать покупателю не позднее 9-го числа месяца,
 * следующего за месяцем расчёта.
 */

/** Чеки «Мой налог» открываются только на этом домене ФНС. */
export const RECEIPT_HOST = "lknpd.nalog.ru";
const MAX_RECEIPT_URL_LENGTH = 500;
const DAY_MS = 86_400_000;

/**
 * Ссылка на чек в обычном виде или null, если это не ссылка на чек: принимается только https на домене
 * lknpd.nalog.ru, без логина, пароля и нестандартного порта. Ссылка уходит покупателю, поэтому чужой адрес
 * сюда попасть не должен.
 */
export function parseReceiptUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value || value.length > MAX_RECEIPT_URL_LENGTH) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.hostname !== RECEIPT_HOST) return null;
  if (url.username || url.password || url.port) return null;
  if (url.pathname === "/" || url.pathname === "") return null;
  return url.toString();
}

/** Дата оплаты для учёта чеков: у покупок, оплаченных до появления paidAt, берётся дата создания. */
export function purchasePaidAt(purchase: { paidAt: Date | null; createdAt: Date }): Date {
  return purchase.paidAt ?? purchase.createdAt;
}

/**
 * Последний день срока выдачи чека: 9-е число месяца, следующего за месяцем оплаты, по московскому времени
 * (полночь этого дня). Москва с 2014 года живёт по UTC+3 без перехода на летнее время.
 */
export function receiptDueDay(paidAt: Date): Date {
  const [year, month] = moscowDay(paidAt).split("-").map(Number);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return new Date(`${nextYear}-${String(nextMonth).padStart(2, "0")}-09T00:00:00+03:00`);
}

/** Срок прошёл: 9-е число месяца, следующего за оплатой, закончилось. */
export function isReceiptOverdue(paidAt: Date, now: Date): boolean {
  return now.getTime() >= receiptDueDay(paidAt).getTime() + DAY_MS;
}

export interface ReceiptBacklog {
  /** Оплаченных покупок, по которым чек ещё не выдан. */
  pending: number;
  /** Из них срок уже прошёл. */
  overdue: number;
  /** Ближайший ещё не прошедший срок (последний день); null, если таких покупок нет. */
  nextDue: Date | null;
}

/** Сводка для главной админ-панели по датам оплаты покупок без выданного чека. */
export function summarizeReceiptBacklog(paidDates: Date[], now: Date): ReceiptBacklog {
  let overdue = 0;
  let nextDue: Date | null = null;
  for (const paidAt of paidDates) {
    if (isReceiptOverdue(paidAt, now)) {
      overdue += 1;
      continue;
    }
    const due = receiptDueDay(paidAt);
    if (!nextDue || due < nextDue) nextDue = due;
  }
  return { pending: paidDates.length, overdue, nextDue };
}

export type ReceiptLang = "ru" | "en";

export function receiptLang(language: string | null | undefined): ReceiptLang {
  return language?.toLowerCase().startsWith("ru") ? "ru" : "en";
}

export interface ReceiptPurchase {
  product: string;
  amount: number;
  currency: string;
  autoRenew: boolean;
  renewal: boolean;
  paidAt: Date;
}

/** Название товара так же, как в истории покупок личного кабинета. */
export function receiptProductName(purchase: Pick<ReceiptPurchase, "product" | "autoRenew" | "renewal">, lang: ReceiptLang): string {
  const a = getDictionary(lang).accountPage;
  if (purchase.product !== "premium_month") return a.productNatalPack;
  if (purchase.renewal) return a.productPremiumRenewal;
  return purchase.autoRenew ? a.productPremiumAutoRenew : a.productPremium;
}

function amountLabel(amount: number, currency: string): string {
  return currency === "XTR" ? `${amount} ⭐` : `${amount} ₽`;
}

const COPY = {
  ru: {
    locale: "ru-RU",
    intro: "🧾 Чек за покупку в Mystara",
    line: (product: string, amount: string, date: string) => `${product}, ${amount}, оплата ${date}.`,
    note: "Чек сформирован в приложении «Мой налог»: исполнитель — самозанятый, НДС не облагается. Ссылка на чек есть и в истории покупок в личном кабинете.",
    button: "Открыть чек",
    subject: "Чек за покупку в Mystara",
  },
  en: {
    locale: "en-GB",
    intro: "🧾 Your Mystara receipt",
    line: (product: string, amount: string, date: string) => `${product}, ${amount}, paid on ${date}.`,
    note: "The receipt was issued in the Russian tax service app “My Tax”: the provider is self-employed and VAT is not charged. The link is also in the purchase history in your account.",
    button: "Open receipt",
    subject: "Your Mystara receipt",
  },
} as const;

const formatDate = (date: Date, locale: string) =>
  new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Moscow" }).format(date);

function receiptLines(purchase: ReceiptPurchase, receiptUrl: string, lang: ReceiptLang): string[] {
  const copy = COPY[lang];
  return [
    copy.intro,
    copy.line(receiptProductName(purchase, lang), amountLabel(purchase.amount, purchase.currency), formatDate(purchase.paidAt, copy.locale)),
    receiptUrl,
    copy.note,
  ];
}

/** Сообщение бота с чеком: текст на языке покупателя и кнопка со ссылкой на чек. */
export function receiptBotMessage(purchase: ReceiptPurchase, receiptUrl: string, lang: ReceiptLang) {
  return {
    text: receiptLines(purchase, receiptUrl, lang).join("\n"),
    replyMarkup: { inline_keyboard: [[{ text: COPY[lang].button, url: receiptUrl }]] },
  };
}

/**
 * Письмо с чеком. Язык сайта у пользователя, вошедшего по e-mail, хранится ненадёжно (по умолчанию "en"),
 * поэтому, как и в остальных письмах, оба языка: сначала язык пользователя, затем второй.
 */
export function receiptEmailMessage(to: string, purchase: ReceiptPurchase, receiptUrl: string, lang: ReceiptLang): MailMessage {
  const other: ReceiptLang = lang === "ru" ? "en" : "ru";
  return {
    to,
    subject: `${COPY[lang].subject} / ${COPY[other].subject}`,
    text: [...receiptLines(purchase, receiptUrl, lang), "", "——", "", ...receiptLines(purchase, receiptUrl, other)].join("\n"),
  };
}
