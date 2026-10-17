/**
 * Платёжные обновления, которые Telegram присылает вебхуку бота при оплате Звёздами.
 * https://core.telegram.org/bots/payments-stars
 *
 *  - `pre_checkout_query`: покупатель нажал «Оплатить»; ответить нужно в течение 10 секунд
 *    (answerPreCheckoutQuery), иначе платёж отменяется.
 *  - `message.successful_payment`: деньги переведены; именно в этот момент начисляются кредиты. У подписки с
 *    автопродлением так же приходит каждое списание: `is_recurring`, `subscription_expiration_date` и тот же
 *    `invoice_payload`, что у первой оплаты (у неё ещё и `is_first_recurring`).
 *  - `subscription`: пользователь отменил подписку, снова включил её или очередное списание не прошло.
 */

export interface TelegramPaymentUpdate {
  pre_checkout_query?: {
    id: string;
    currency: string;
    total_amount: number;
    invoice_payload: string;
  };
  message?: {
    date?: number;
    chat?: { id: number; type?: string };
    from?: { id?: number; language_code?: string };
    successful_payment?: {
      currency: string;
      total_amount: number;
      invoice_payload: string;
      telegram_payment_charge_id: string;
      subscription_expiration_date?: number;
      is_recurring?: boolean;
      is_first_recurring?: boolean;
    };
  };
  subscription?: {
    user?: { id?: number; language_code?: string };
    invoice_payload?: string;
    state?: string;
  };
}

/** Списание по подписке: первое ли оно и до какого числа Telegram продлил подписку. */
export interface RecurringPaymentInfo {
  first: boolean;
  expiresAt: Date | null;
}

export type StarSubscriptionState = "active" | "canceled" | "failed";

export type StarsEvent =
  | { kind: "pre_checkout"; queryId: string; purchaseId: string; amount: number; currency: string }
  | {
      kind: "paid";
      purchaseId: string;
      amount: number;
      currency: string;
      chargeId: string;
      chatId: number | null;
      languageCode: string | null;
      telegramUserId: number | null;
      paidAt: Date | null;
      recurring: RecurringPaymentInfo | null;
    }
  | { kind: "subscription"; purchaseId: string; state: StarSubscriptionState; telegramUserId: number | null; languageCode: string | null };

const unixToDate = (value: unknown): Date | null => (typeof value === "number" && Number.isFinite(value) && value > 0 ? new Date(value * 1000) : null);

export function parseStarsEvent(update: TelegramPaymentUpdate | null | undefined): StarsEvent | null {
  const query = update?.pre_checkout_query;
  if (query && typeof query.id === "string" && typeof query.invoice_payload === "string") {
    return {
      kind: "pre_checkout",
      queryId: query.id,
      purchaseId: query.invoice_payload,
      amount: query.total_amount,
      currency: query.currency,
    };
  }
  const paid = update?.message?.successful_payment;
  if (paid && typeof paid.invoice_payload === "string" && typeof paid.telegram_payment_charge_id === "string") {
    return {
      kind: "paid",
      purchaseId: paid.invoice_payload,
      amount: paid.total_amount,
      currency: paid.currency,
      chargeId: paid.telegram_payment_charge_id,
      chatId: typeof update?.message?.chat?.id === "number" ? update.message.chat.id : null,
      languageCode: update?.message?.from?.language_code ?? null,
      telegramUserId: typeof update?.message?.from?.id === "number" ? update.message.from.id : null,
      paidAt: unixToDate(update?.message?.date),
      recurring: paid.is_recurring ? { first: paid.is_first_recurring === true, expiresAt: unixToDate(paid.subscription_expiration_date) } : null,
    };
  }
  const subscription = update?.subscription;
  if (subscription && typeof subscription.invoice_payload === "string" && (subscription.state === "active" || subscription.state === "canceled" || subscription.state === "failed")) {
    return {
      kind: "subscription",
      purchaseId: subscription.invoice_payload,
      state: subscription.state,
      telegramUserId: typeof subscription.user?.id === "number" ? subscription.user.id : null,
      languageCode: subscription.user?.language_code ?? null,
    };
  }
  return null;
}

/** Ответ, который возвращается как ответ вебхука: Telegram выполняет найденный там `method`. */
export function buildPreCheckoutAnswer(queryId: string, ok: boolean) {
  return ok
    ? { method: "answerPreCheckoutQuery" as const, pre_checkout_query_id: queryId, ok: true as const }
    : {
        method: "answerPreCheckoutQuery" as const,
        pre_checkout_query_id: queryId,
        ok: false as const,
        error_message: "This order is no longer available. Please start a new purchase in the app.",
      };
}
