import { createHash, createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { NATAL_CHART_PRICES, enabledProviders, isPaymentProviderId } from "./catalog";
import { createCryptoBotInvoice, verifyCryptoBotSignature } from "./providers/cryptobot";
import { createStarsInvoiceLink } from "./providers/stars";
import { createYooKassaPayment, fetchYooKassaPayment } from "./providers/yookassa";

const jsonResponse = (body: unknown, ok = true) => ({ ok, json: async () => body }) as Response;

describe("enabledProviders", () => {
  const all = { TELEGRAM_BOT_TOKEN: "t", YOOKASSA_SHOP_ID: "1", YOOKASSA_SECRET_KEY: "k", CRYPTOBOT_API_TOKEN: "c" };

  it("offers only Stars inside Telegram, whatever else is configured", () => {
    expect(enabledProviders(all, "telegram")).toEqual(["stars"]);
  });

  it("offers every configured method on the website", () => {
    expect(enabledProviders(all, "web")).toEqual(["stars", "yookassa", "cryptobot"]);
  });

  it("turns a method on only when all its credentials are present", () => {
    expect(enabledProviders({ YOOKASSA_SHOP_ID: "1" }, "web")).toEqual([]);
    expect(enabledProviders({ CRYPTOBOT_API_TOKEN: "c" }, "web")).toEqual(["cryptobot"]);
    expect(enabledProviders({}, "telegram")).toEqual([]);
  });
});

describe("catalog", () => {
  it("prices the pack in each provider's currency", () => {
    expect(NATAL_CHART_PRICES.stars.currency).toBe("XTR");
    expect(NATAL_CHART_PRICES.yookassa).toEqual({ amount: 1000, currency: "RUB" });
    expect(NATAL_CHART_PRICES.cryptobot).toEqual({ amount: 10, currency: "USD" });
  });

  it("recognizes only known provider ids", () => {
    expect(isPaymentProviderId("stars")).toBe(true);
    expect(isPaymentProviderId("paypal")).toBe(false);
    expect(isPaymentProviderId(undefined)).toBe(false);
  });
});

describe("verifyCryptoBotSignature", () => {
  const token = "123:test-token";
  const body = JSON.stringify({ update_type: "invoice_paid", payload: { invoice_id: 7 } });
  const sign = (b: string) => createHmac("sha256", createHash("sha256").update(token).digest()).update(b).digest("hex");

  it("accepts a correct signature", () => {
    expect(verifyCryptoBotSignature(token, body, sign(body))).toBe(true);
  });

  it("rejects a tampered body, a wrong token and a missing signature", () => {
    expect(verifyCryptoBotSignature(token, body + " ", sign(body))).toBe(false);
    expect(verifyCryptoBotSignature("other-token", body, sign(body))).toBe(false);
    expect(verifyCryptoBotSignature(token, body, null)).toBe(false);
    expect(verifyCryptoBotSignature(token, body, "")).toBe(false);
  });
});

describe("provider clients", () => {
  it("creates a Stars invoice link priced in XTR with the purchase id as payload", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ ok: true, result: "https://t.me/$abc" }));
    const link = await createStarsInvoiceLink(
      { botToken: "TOKEN", purchaseId: "p1", title: "Pack", description: "d", amount: 500 },
      fetchImpl,
    );
    expect(link).toBe("https://t.me/$abc");
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.telegram.org/botTOKEN/createInvoiceLink");
    expect(JSON.parse(init.body)).toMatchObject({ currency: "XTR", payload: "p1", prices: [{ amount: 500 }] });
  });

  it("fails loudly when Telegram refuses the invoice", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ ok: false }, false));
    await expect(
      createStarsInvoiceLink({ botToken: "T", purchaseId: "p", title: "t", description: "d", amount: 1 }, fetchImpl),
    ).rejects.toThrow("stars_invoice_failed");
  });

  it("creates a ЮKassa payment with an idempotence key and the purchase in metadata", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse({ id: "pay-1", status: "pending", confirmation: { confirmation_url: "https://yoomoney.ru/pay" } }));
    const result = await createYooKassaPayment(
      { shopId: "shop", secretKey: "secret" },
      { purchaseId: "p1", amountRub: 1000, description: "Pack", returnUrl: "https://x.test/back" },
      fetchImpl,
    );
    expect(result).toEqual({ id: "pay-1", confirmationUrl: "https://yoomoney.ru/pay" });
    const [, init] = fetchImpl.mock.calls[0];
    expect(init.headers["Idempotence-Key"]).toBe("p1");
    expect(init.headers.Authorization).toBe(`Basic ${Buffer.from("shop:secret").toString("base64")}`);
    expect(JSON.parse(init.body)).toMatchObject({
      amount: { value: "1000.00", currency: "RUB" },
      capture: true,
      metadata: { purchaseId: "p1" },
    });
  });

  it("returns null when ЮKassa can't find the payment", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, false));
    expect(await fetchYooKassaPayment({ shopId: "s", secretKey: "k" }, "nope", fetchImpl)).toBeNull();
  });

  it("creates a USD-priced Crypto Pay invoice payable in USDT or TON", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse({ ok: true, result: { invoice_id: 9, bot_invoice_url: "https://t.me/CryptoBot?start=x" } }));
    const result = await createCryptoBotInvoice("tok", { purchaseId: "p1", amountUsd: 10, description: "Pack", returnUrl: "https://x.test" }, fetchImpl);
    expect(result).toEqual({ id: 9, url: "https://t.me/CryptoBot?start=x" });
    const [, init] = fetchImpl.mock.calls[0];
    expect(init.headers["Crypto-Pay-API-Token"]).toBe("tok");
    expect(JSON.parse(init.body)).toMatchObject({
      currency_type: "fiat",
      fiat: "USD",
      amount: "10",
      accepted_assets: "USDT,TON",
      payload: "p1",
    });
  });
});
