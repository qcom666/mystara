import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MailMessage } from "@/lib/mail/mailer";

const mocks = vi.hoisted(() => ({
  getReceiptDelivery: vi.fn(),
  markReceiptSent: vi.fn(),
}));

vi.mock("@/lib/repositories/receipt.repository", () => ({ getReceiptDelivery: mocks.getReceiptDelivery, markReceiptSent: mocks.markReceiptSent }));

import { sendReceiptToBuyer } from "./receipt-delivery";

const RECEIPT = "https://lknpd.nalog.ru/api/v1/receipt/771234567890/20abcdef12/print";

function purchase(overrides: Record<string, unknown> = {}, user: Record<string, unknown> = {}) {
  return {
    id: "p1",
    userId: "u1",
    status: "paid",
    product: "natal_pack",
    amount: 1000,
    currency: "RUB",
    autoRenew: false,
    renewalOfId: null,
    paidAt: new Date("2026-10-18T12:00:00Z"),
    createdAt: new Date("2026-10-18T11:58:00Z"),
    receiptUrl: RECEIPT,
    user: { telegramId: "42", email: "buyer@example.com", language: "ru", ...user },
    ...overrides,
  };
}

function botFetch(status = 200) {
  return vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    void url;
    void init;
    return new Response(JSON.stringify({ ok: status === 200 }), { status });
  });
}

function mailer(fail = false) {
  const sent: MailMessage[] = [];
  return {
    sent,
    send: vi.fn(async (message: MailMessage) => {
      if (fail) throw new Error("smtp down");
      sent.push(message);
    }),
  };
}

const input = { purchaseId: "p1", adminId: "admin-1" };

beforeEach(() => {
  mocks.getReceiptDelivery.mockReset();
  mocks.markReceiptSent.mockReset();
  mocks.markReceiptSent.mockResolvedValue(true);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("sendReceiptToBuyer", () => {
  it("отправляет чек ботом и письмом на языке покупателя и отмечает выданным", async () => {
    mocks.getReceiptDelivery.mockResolvedValue(purchase());
    const fetchImpl = botFetch();
    const mail = mailer();

    const outcome = await sendReceiptToBuyer(input, { botToken: "123:test", mailer: mail, fetchImpl });

    expect(outcome).toEqual({ ok: true, channels: ["telegram", "email"] });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(String(url)).toContain("/bot123:test/sendMessage");
    const body = JSON.parse(String(init?.body));
    expect(body.chat_id).toBe("42");
    expect(body.text).toContain("Чек за покупку");
    expect(body.text).toContain(RECEIPT);
    expect(body.reply_markup.inline_keyboard[0][0].url).toBe(RECEIPT);
    expect(mail.sent[0].to).toBe("buyer@example.com");
    expect(mail.sent[0].text).toContain(RECEIPT);
    expect(mocks.markReceiptSent).toHaveBeenCalledWith({ purchaseId: "p1", adminId: "admin-1", receiptUrl: RECEIPT, channels: ["telegram", "email"] });
  });

  it("пишет по-английски, если язык покупателя не русский", async () => {
    mocks.getReceiptDelivery.mockResolvedValue(purchase({}, { language: "en", email: null }));
    const fetchImpl = botFetch();
    await sendReceiptToBuyer(input, { botToken: "123:test", mailer: null, fetchImpl });
    expect(JSON.parse(String(fetchImpl.mock.calls[0][1]?.body)).text).toContain("Your Mystara receipt");
  });

  it("без бота отправляет только письмом, без почты — только ботом", async () => {
    mocks.getReceiptDelivery.mockResolvedValue(purchase());
    const mail = mailer();
    expect(await sendReceiptToBuyer(input, { botToken: "", mailer: mail, fetchImpl: botFetch() })).toEqual({ ok: true, channels: ["email"] });

    const fetchImpl = botFetch();
    expect(await sendReceiptToBuyer(input, { botToken: "123:test", mailer: null, fetchImpl })).toEqual({ ok: true, channels: ["telegram"] });
  });

  it("засчитывает доставку хотя бы одним каналом", async () => {
    mocks.getReceiptDelivery.mockResolvedValue(purchase());
    const outcome = await sendReceiptToBuyer(input, { botToken: "123:test", mailer: mailer(), fetchImpl: botFetch(403) });
    expect(outcome).toEqual({ ok: true, channels: ["email"] });
    expect(mocks.markReceiptSent).toHaveBeenCalledWith(expect.objectContaining({ channels: ["email"] }));
  });

  it("ничего не отмечает, если чек не дошёл ни одним каналом", async () => {
    mocks.getReceiptDelivery.mockResolvedValue(purchase());
    const outcome = await sendReceiptToBuyer(input, { botToken: "123:test", mailer: mailer(true), fetchImpl: botFetch(500) });
    expect(outcome).toEqual({ ok: false, error: "delivery_failed" });
    expect(mocks.markReceiptSent).not.toHaveBeenCalled();
  });

  it("сообщает, что связаться с покупателем нечем", async () => {
    mocks.getReceiptDelivery.mockResolvedValue(purchase({}, { telegramId: null, email: "buyer@example.com" }));
    const fetchImpl = botFetch();
    expect(await sendReceiptToBuyer(input, { botToken: "123:test", mailer: null, fetchImpl })).toEqual({ ok: false, error: "no_channel" });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(mocks.markReceiptSent).not.toHaveBeenCalled();
  });

  it("отмечает выданным вручную без отправки", async () => {
    mocks.getReceiptDelivery.mockResolvedValue(purchase({}, { telegramId: null, email: null }));
    const fetchImpl = botFetch();
    expect(await sendReceiptToBuyer({ ...input, manual: true }, { botToken: "123:test", mailer: null, fetchImpl })).toEqual({ ok: true, channels: ["manual"] });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(mocks.markReceiptSent).toHaveBeenCalledWith(expect.objectContaining({ channels: ["manual"] }));
  });

  it("не отправляет без ссылки, по неоплаченной и несуществующей покупке", async () => {
    const fetchImpl = botFetch();
    mocks.getReceiptDelivery.mockResolvedValueOnce(purchase({ receiptUrl: null }));
    expect(await sendReceiptToBuyer(input, { botToken: "123:test", mailer: null, fetchImpl })).toEqual({ ok: false, error: "no_receipt" });
    mocks.getReceiptDelivery.mockResolvedValueOnce(purchase({ status: "refunded" }));
    expect(await sendReceiptToBuyer(input, { botToken: "123:test", mailer: null, fetchImpl })).toEqual({ ok: false, error: "not_paid" });
    mocks.getReceiptDelivery.mockResolvedValueOnce(null);
    expect(await sendReceiptToBuyer(input, { botToken: "123:test", mailer: null, fetchImpl })).toEqual({ ok: false, error: "not_found" });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(mocks.markReceiptSent).not.toHaveBeenCalled();
  });

  it("сообщает о конфликте, если ссылку заменили во время отправки", async () => {
    mocks.getReceiptDelivery.mockResolvedValue(purchase());
    mocks.markReceiptSent.mockResolvedValue(false);
    expect(await sendReceiptToBuyer(input, { botToken: "123:test", mailer: null, fetchImpl: botFetch() })).toEqual({ ok: false, error: "conflict" });
  });
});
