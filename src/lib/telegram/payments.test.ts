import { describe, expect, it } from "vitest";
import { buildPreCheckoutAnswer, parseStarsEvent } from "./payments";

describe("parseStarsEvent", () => {
  it("reads a pre-checkout query", () => {
    expect(
      parseStarsEvent({ pre_checkout_query: { id: "q1", currency: "XTR", total_amount: 500, invoice_payload: "purchase-1" } }),
    ).toEqual({ kind: "pre_checkout", queryId: "q1", purchaseId: "purchase-1", amount: 500, currency: "XTR" });
  });

  it("reads a successful payment, keeping the charge id", () => {
    expect(
      parseStarsEvent({
        message: {
          successful_payment: {
            currency: "XTR",
            total_amount: 500,
            invoice_payload: "purchase-1",
            telegram_payment_charge_id: "charge-9",
          },
        },
      }),
    ).toEqual({
      kind: "paid",
      purchaseId: "purchase-1",
      amount: 500,
      currency: "XTR",
      chargeId: "charge-9",
      chatId: null,
      languageCode: null,
      telegramUserId: null,
      paidAt: null,
      recurring: null,
    });
  });

  it("reads a subscription charge: first or repeated, with the subscription end", () => {
    const charge = (extra: Record<string, unknown>) =>
      parseStarsEvent({
        message: {
          date: 1_792_000_000,
          from: { id: 42 },
          successful_payment: { currency: "XTR", total_amount: 150, invoice_payload: "purchase-1", telegram_payment_charge_id: "charge-2", ...extra },
        },
      });
    expect(charge({ is_recurring: true, is_first_recurring: true, subscription_expiration_date: 1_794_592_000 })).toMatchObject({
      kind: "paid",
      telegramUserId: 42,
      paidAt: new Date(1_792_000_000_000),
      recurring: { first: true, expiresAt: new Date(1_794_592_000_000) },
    });
    expect(charge({ is_recurring: true, subscription_expiration_date: 1_794_592_000 })).toMatchObject({ recurring: { first: false } });
  });

  it("reads subscription state changes and ignores unknown states", () => {
    expect(parseStarsEvent({ subscription: { user: { id: 42, language_code: "ru" }, invoice_payload: "purchase-1", state: "canceled" } })).toEqual({
      kind: "subscription",
      purchaseId: "purchase-1",
      state: "canceled",
      telegramUserId: 42,
      languageCode: "ru",
    });
    expect(parseStarsEvent({ subscription: { invoice_payload: "purchase-1", state: "paused" } })).toBeNull();
  });

  it("keeps the chat and language for the confirmation message", () => {
    const event = parseStarsEvent({
      message: {
        chat: { id: 77, type: "private" },
        from: { language_code: "ru" },
        successful_payment: { currency: "XTR", total_amount: 500, invoice_payload: "purchase-1", telegram_payment_charge_id: "charge-9" },
      },
    });
    expect(event).toMatchObject({ kind: "paid", chatId: 77, languageCode: "ru" });
  });

  it("ignores everything else", () => {
    expect(parseStarsEvent({})).toBeNull();
    expect(parseStarsEvent(null)).toBeNull();
    expect(parseStarsEvent({ message: {} })).toBeNull();
  });
});

describe("buildPreCheckoutAnswer", () => {
  it("approves with just the query id", () => {
    expect(buildPreCheckoutAnswer("q1", true)).toEqual({ method: "answerPreCheckoutQuery", pre_checkout_query_id: "q1", ok: true });
  });

  it("declines with a message for the buyer", () => {
    const answer = buildPreCheckoutAnswer("q1", false);
    expect(answer).toMatchObject({ ok: false, error_message: expect.stringMatching(/.+/) });
  });
});
