import { describe, expect, it, vi } from "vitest";
import { purchaseNoticeKeyboard, purchaseNoticeText, sendPurchaseNotice } from "./purchase-notice";

describe("сообщение покупателю после оплаты", () => {
  it("Premium: дата окончания по Москве", () => {
    const text = purchaseNoticeText({ product: "premium_month", creditsGranted: 0, credits: 0, premiumUntil: new Date("2026-11-16T21:30:00Z") }, "ru");
    expect(text).toContain("Premium активен до 17 ноября 2026");
  });

  it("пакет: сколько начислено и сколько всего", () => {
    expect(purchaseNoticeText({ product: "natal_pack", creditsGranted: 3, credits: 4, premiumUntil: null }, "en")).toContain("credits added: 3. Balance: 4");
  });

  it("кнопка ведёт на нужную страницу мини-приложения", () => {
    expect(purchaseNoticeKeyboard("ru", "https://site.test", "premium_month").inline_keyboard[0][0].web_app.url).toBe("https://site.test/pricing");
    expect(purchaseNoticeKeyboard("ru", "https://site.test", "natal_pack").inline_keyboard[0][0].web_app.url).toBe("https://site.test/astrology/natal-chart");
  });

  it("отказ Telegram не ломает оплату: false вместо исключения", async () => {
    const details = { product: "natal_pack", creditsGranted: 3, credits: 3, premiumUntil: null };
    const refused = vi.fn(async () => new Response("{}", { status: 403 }));
    await expect(sendPurchaseNotice({ botToken: "t", chatId: "1", lang: "ru", appUrl: "https://s.test", details }, refused as never)).resolves.toBe(false);
    const broken = vi.fn(async () => {
      throw new Error("network");
    });
    await expect(sendPurchaseNotice({ botToken: "t", chatId: "1", lang: "ru", appUrl: "https://s.test", details }, broken as never)).resolves.toBe(false);
  });
});
