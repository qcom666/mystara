import { logError, logWarning } from "@/lib/logger";
import { getMailer, type Mailer } from "@/lib/mail/mailer";
import { getReceiptDelivery, markReceiptSent } from "@/lib/repositories/receipt.repository";
import { sendBotMessage } from "@/lib/telegram/bot-api";
import { purchasePaidAt, receiptBotMessage, receiptEmailMessage, receiptLang } from "./receipts";

/**
 * Каналы, которыми чек уходит покупателю: бот (если аккаунт связан с Telegram) и письмо (если есть e-mail и
 * настроен SMTP). "manual" — оператор передал чек сам, без отправки из сервиса.
 */
export type ReceiptChannel = "telegram" | "email" | "manual";

export type SendReceiptOutcome =
  | { ok: true; channels: ReceiptChannel[] }
  | { ok: false; error: "not_found" | "not_paid" | "no_receipt" | "no_channel" | "delivery_failed" | "conflict" };

export interface ReceiptDeliveryDeps {
  botToken?: string;
  mailer?: Mailer | null;
  fetchImpl?: typeof fetch;
}

/**
 * Отправляет покупателю ссылку на чек всеми доступными каналами. Отметка об отправке и запись в журнал
 * ставятся, если чек дошёл хотя бы одним каналом; если не дошёл ни одним, ничего не меняется и отправку
 * можно повторить. Повторная отправка уже выданного чека разрешена (например, по просьбе покупателя).
 */
export async function sendReceiptToBuyer(
  input: { purchaseId: string; adminId: string; manual?: boolean },
  deps: ReceiptDeliveryDeps = {},
): Promise<SendReceiptOutcome> {
  const purchase = await getReceiptDelivery(input.purchaseId);
  if (!purchase) return { ok: false, error: "not_found" };
  if (purchase.status !== "paid") return { ok: false, error: "not_paid" };
  if (!purchase.receiptUrl) return { ok: false, error: "no_receipt" };
  const receiptUrl = purchase.receiptUrl;

  const finish = async (channels: ReceiptChannel[]): Promise<SendReceiptOutcome> =>
    (await markReceiptSent({ purchaseId: purchase.id, adminId: input.adminId, receiptUrl, channels })) ? { ok: true, channels } : { ok: false, error: "conflict" };

  if (input.manual) return finish(["manual"]);

  const botToken = deps.botToken === undefined ? process.env.TELEGRAM_BOT_TOKEN : deps.botToken;
  const mailer = deps.mailer === undefined ? getMailer() : deps.mailer;
  const telegramId = botToken ? purchase.user.telegramId : null;
  const email = mailer ? purchase.user.email : null;
  if (!telegramId && !email) return { ok: false, error: "no_channel" };

  const lang = receiptLang(purchase.user.language);
  const details = {
    product: purchase.product,
    amount: purchase.amount,
    currency: purchase.currency,
    autoRenew: purchase.autoRenew,
    renewal: purchase.renewalOfId !== null,
    paidAt: purchasePaidAt(purchase),
  };
  const delivered: ReceiptChannel[] = [];

  if (botToken && telegramId) {
    const message = receiptBotMessage(details, receiptUrl, lang);
    const status = await sendBotMessage(botToken, telegramId, message.text, message.replyMarkup, deps.fetchImpl);
    if (status === 200) delivered.push("telegram");
    else logWarning("receipt", "bot did not deliver the receipt", { purchaseId: purchase.id, status });
  }

  if (mailer && email) {
    try {
      await mailer.send(receiptEmailMessage(email, details, receiptUrl, lang));
      delivered.push("email");
    } catch (error) {
      logError("receipt", error, { purchaseId: purchase.id });
    }
  }

  return delivered.length > 0 ? finish(delivered) : { ok: false, error: "delivery_failed" };
}
