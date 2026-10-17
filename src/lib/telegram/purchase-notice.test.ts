import { describe, expect, it, vi } from "vitest";
import { purchaseNoticeKeyboard, purchaseNoticeText, sendPurchaseNotice, subscriptionStateText } from "./purchase-notice";

describe("сообщение покупателю после оплаты", () => {
  it("Premium: дата окончания по Москве", () => {
    const text = purchaseNoticeText({ product: "premium_month", creditsGranted: 0, credits: 0, premiumUntil: new Date("2026-11-16T21:30:00Z") }, "ru");
    expect(text).toContain("Premium активен до 17 ноября 2026");
  });

  it("подписка с автопродлением: когда следующее списание и как его отключить", () => {
    const base = { product: "premium_month", creditsGranted: 0, credits: 0, premiumUntil: new Date("2026-11-16T21:30:00Z"), nextChargeAt: new Date("2026-11-16T21:30:00Z") };
    expect(purchaseNoticeText(base, "ru")).toMatch(/Premium активен до 17 ноября 2026.*следующее списание 17 ноября 2026 г\., отключить его можно в личном кабинете или в настройках Telegram\.$/);
    expect(purchaseNoticeText({ ...base, renewal: true }, "ru")).toMatch(/^✨ Premium продлён до 17 ноября 2026/);
    expect(purchaseNoticeText({ ...base, renewal: true, nextChargeAt: null }, "en")).not.toContain("next charge");
  });

  it("отключение, возобновление и неудачное списание подписки", () => {
    const details = { premiumUntil: new Date("2026-12-01T09:00:00Z"), nextChargeAt: new Date("2026-11-20T09:00:00Z") };
    expect(subscriptionStateText("canceled", details, "ru")).toContain("действует до 1 декабря 2026");
    expect(subscriptionStateText("active", details, "ru")).toMatch(/следующее списание — 20 ноября 2026 г\.$/);
    expect(subscriptionStateText("canceled", details, "ru")).not.toContain("..");
    expect(subscriptionStateText("failed", details, "en")).toContain("couldn't charge Stars");
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
