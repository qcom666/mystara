/**
 * Платёжные обновления, которые Telegram присылает вебхуку бота при оплате Звёздами.
 * https://core.telegram.org/bots/payments-stars
 *
 *  - `pre_checkout_query`: покупатель нажал «Оплатить»; ответить нужно в течение 10 секунд
 *    (answerPreCheckoutQuery), иначе платёж отменяется.
 *  - `message.successful_payment`: деньги переведены; именно в этот момент начисляются кредиты.
 */

export interface TelegramPaymentUpdate {
  pre_checkout_query?: {
    id: string;
    currency: string;
    total_amount: number;
    invoice_payload: string;
  };
  message?: {
    successful_payment?: {
      currency: string;
      total_amount: number;
      invoice_payload: string;
      telegram_payment_charge_id: string;
    };
  };
}

export type StarsEvent =
  | { kind: "pre_checkout"; queryId: string; purchaseId: string; amount: number; currency: string }
  | { kind: "paid"; purchaseId: string; amount: number; currency: string; chargeId: string };

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
