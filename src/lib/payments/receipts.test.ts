import { describe, expect, it } from "vitest";
import {
  isReceiptOverdue,
  parseReceiptUrl,
  purchasePaidAt,
  receiptBotMessage,
  receiptDueDay,
  receiptEmailMessage,
  receiptLang,
  summarizeReceiptBacklog,
} from "./receipts";

const RECEIPT = "https://lknpd.nalog.ru/api/v1/receipt/771234567890/20abcdef12/print";

describe("parseReceiptUrl", () => {
  it("принимает ссылку на чек «Мой налог»", () => {
    expect(parseReceiptUrl(RECEIPT)).toBe(RECEIPT);
    expect(parseReceiptUrl(`  ${RECEIPT}\n`)).toBe(RECEIPT);
    expect(parseReceiptUrl("https://LKNPD.nalog.ru/api/v1/receipt/1/2/print")).toBe("https://lknpd.nalog.ru/api/v1/receipt/1/2/print");
  });

  it("отвергает не https", () => {
    expect(parseReceiptUrl("http://lknpd.nalog.ru/api/v1/receipt/1/2/print")).toBeNull();
    expect(parseReceiptUrl("javascript:alert(1)")).toBeNull();
  });

  it("отвергает чужие и похожие домены", () => {
    expect(parseReceiptUrl("https://nalog.ru/api/v1/receipt/1/2/print")).toBeNull();
    expect(parseReceiptUrl("https://lknpd.nalog.ru.evil.example/receipt")).toBeNull();
    expect(parseReceiptUrl("https://evil.example/?u=https://lknpd.nalog.ru/x")).toBeNull();
    expect(parseReceiptUrl("https://lknpd.nalog.ru@evil.example/x")).toBeNull();
    expect(parseReceiptUrl("https://user:pass@lknpd.nalog.ru/x")).toBeNull();
    expect(parseReceiptUrl("https://lknpd.nalog.ru:8443/x")).toBeNull();
    expect(parseReceiptUrl("https://xlknpd.nalog.ru/x")).toBeNull();
  });

  it("отвергает пустое, корень сайта, мусор и слишком длинное", () => {
    expect(parseReceiptUrl("")).toBeNull();
    expect(parseReceiptUrl("   ")).toBeNull();
    expect(parseReceiptUrl(undefined)).toBeNull();
    expect(parseReceiptUrl(42)).toBeNull();
    expect(parseReceiptUrl("https://lknpd.nalog.ru/")).toBeNull();
    expect(parseReceiptUrl("не ссылка")).toBeNull();
    expect(parseReceiptUrl(`https://lknpd.nalog.ru/${"a".repeat(600)}`)).toBeNull();
  });
});

describe("срок выдачи чека", () => {
  it("9-е число следующего месяца по Москве", () => {
    expect(receiptDueDay(new Date("2026-10-18T12:00:00Z")).toISOString()).toBe("2026-11-08T21:00:00.000Z");
    // Декабрь переходит на январь следующего года.
    expect(receiptDueDay(new Date("2026-12-31T12:00:00Z")).toISOString()).toBe("2027-01-08T21:00:00.000Z");
  });

  it("месяц оплаты считается по московскому времени", () => {
    // 31 октября 22:30 UTC — уже 1 ноября в Москве: срок до 9 декабря.
    expect(receiptDueDay(new Date("2026-10-31T22:30:00Z")).toISOString()).toBe("2026-12-08T21:00:00.000Z");
    expect(receiptDueDay(new Date("2026-10-31T20:30:00Z")).toISOString()).toBe("2026-11-08T21:00:00.000Z");
  });

  it("просрочка начинается после окончания 9-го числа", () => {
    const paidAt = new Date("2026-10-05T10:00:00Z");
    expect(isReceiptOverdue(paidAt, new Date("2026-11-09T20:59:59Z"))).toBe(false);
    expect(isReceiptOverdue(paidAt, new Date("2026-11-09T21:00:00Z"))).toBe(true);
  });

  it("у старых покупок без даты оплаты берётся дата создания", () => {
    const createdAt = new Date("2026-09-01T00:00:00Z");
    expect(purchasePaidAt({ paidAt: null, createdAt })).toBe(createdAt);
    const paidAt = new Date("2026-09-02T00:00:00Z");
    expect(purchasePaidAt({ paidAt, createdAt })).toBe(paidAt);
  });

  it("сводка: сколько без чека, сколько просрочено и ближайший срок", () => {
    const now = new Date("2026-11-12T09:00:00Z");
    const summary = summarizeReceiptBacklog(
      [new Date("2026-10-20T09:00:00Z"), new Date("2026-11-01T09:00:00Z"), new Date("2026-11-10T09:00:00Z")],
      now,
    );
    expect(summary.pending).toBe(3);
    expect(summary.overdue).toBe(1);
    expect(summary.nextDue?.toISOString()).toBe("2026-12-08T21:00:00.000Z");
    expect(summarizeReceiptBacklog([], now)).toEqual({ pending: 0, overdue: 0, nextDue: null });
  });
});

describe("тексты чека", () => {
  const purchase = { product: "natal_pack", amount: 1000, currency: "RUB", autoRenew: false, renewal: false, paidAt: new Date("2026-10-18T12:00:00Z") };

  it("язык берётся из профиля, всё, кроме русского, — английский", () => {
    expect(receiptLang("ru")).toBe("ru");
    expect(receiptLang("ru-RU")).toBe("ru");
    expect(receiptLang("en")).toBe("en");
    expect(receiptLang("uk")).toBe("en");
    expect(receiptLang(null)).toBe("en");
  });

  it("сообщение бота на языке покупателя со ссылкой и кнопкой", () => {
    const ru = receiptBotMessage(purchase, RECEIPT, "ru");
    expect(ru.text).toContain("Чек за покупку");
    expect(ru.text).toContain("1000 ₽");
    expect(ru.text).toContain("18 октября 2026");
    expect(ru.text).toContain(RECEIPT);
    expect(ru.replyMarkup.inline_keyboard[0][0]).toEqual({ text: "Открыть чек", url: RECEIPT });

    const en = receiptBotMessage({ ...purchase, product: "premium_month", amount: 250, currency: "XTR" }, RECEIPT, "en");
    expect(en.text).toContain("Your Mystara receipt");
    expect(en.text).toContain("Premium for 30 days");
    expect(en.text).toContain("250 ⭐");
    expect(en.text).not.toContain("Чек");
  });

  it("письмо: сначала язык покупателя, затем второй", () => {
    const mail = receiptEmailMessage("buyer@example.com", purchase, RECEIPT, "ru");
    expect(mail.to).toBe("buyer@example.com");
    expect(mail.subject.startsWith("Чек за покупку в Mystara")).toBe(true);
    expect(mail.text.indexOf("Чек за покупку")).toBeLessThan(mail.text.indexOf("Your Mystara receipt"));
    expect(mail.text.split(RECEIPT)).toHaveLength(3);

    const en = receiptEmailMessage("buyer@example.com", purchase, RECEIPT, "en");
    expect(en.subject.startsWith("Your Mystara receipt")).toBe(true);
  });
});
