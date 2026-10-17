import { describe, expect, it, vi } from "vitest";
import { NATAL_CHART_PRICES, PREMIUM_PRICES, PRODUCT_PRICES, enabledProviders, isPaymentProductId, isPaymentProviderId, supportsAutoRenew } from "./catalog";
import { createStarsInvoiceLink } from "./providers/stars";
import { createYooKassaPayment, fetchYooKassaPayment } from "./providers/yookassa";

const jsonResponse = (body: unknown, ok = true) => ({ ok, json: async () => body }) as Response;

describe("enabledProviders", () => {
  const all = { TELEGRAM_BOT_TOKEN: "t", YOOKASSA_SHOP_ID: "1", YOOKASSA_SECRET_KEY: "k", CRYPTOBOT_API_TOKEN: "c" };
  // CRYPTOBOT_API_TOKEN остаётся в тестовых данных намеренно: даже если его кто-то задаст,
  // способ оплаты криптовалютой появляться не должен.

  it("offers only Stars inside Telegram, whatever else is configured", () => {
    expect(enabledProviders(all, "telegram")).toEqual(["stars"]);
  });

  it("offers only ЮKassa on the website — Stars never appear there", () => {
    expect(enabledProviders(all, "web")).toEqual(["yookassa"]);
    expect(enabledProviders({ TELEGRAM_BOT_TOKEN: "t" }, "web")).toEqual([]);
  });

  it("turns a method on only when all its credentials are present", () => {
    expect(enabledProviders({ YOOKASSA_SHOP_ID: "1" }, "web")).toEqual([]);
    expect(enabledProviders({ CRYPTOBOT_API_TOKEN: "c" }, "web")).toEqual([]);
    expect(enabledProviders({}, "telegram")).toEqual([]);
  });
});

describe("catalog", () => {
  it("prices the pack in each provider's currency", () => {
    expect(NATAL_CHART_PRICES.stars.currency).toBe("XTR");
    expect(NATAL_CHART_PRICES.yookassa).toEqual({ amount: 1000, currency: "RUB" });
    expect(Object.keys(NATAL_CHART_PRICES).sort()).toEqual(["stars", "yookassa"]);
  });

  it("prices Premium for 300 RUB, or 150 Stars inside Telegram", () => {
    expect(PREMIUM_PRICES.yookassa).toEqual({ amount: 300, currency: "RUB" });
    expect(PREMIUM_PRICES.stars).toEqual({ amount: 150, currency: "XTR" });
  });

  it("has a price from every provider for every product", () => {
    expect(Object.keys(PRODUCT_PRICES).sort()).toEqual(["natal_pack", "premium_month"]);
    for (const prices of Object.values(PRODUCT_PRICES)) expect(Object.keys(prices).sort()).toEqual(["stars", "yookassa"]);
  });

  it("recognizes only known product ids", () => {
    expect(isPaymentProductId("premium_month")).toBe(true);
    expect(isPaymentProductId("natal_pack")).toBe(true);
    expect(isPaymentProductId("gold")).toBe(false);
  });

  it("recognizes only known provider ids", () => {
    expect(isPaymentProviderId("stars")).toBe(true);
    expect(isPaymentProviderId("paypal")).toBe(false);
    expect(isPaymentProviderId(undefined)).toBe(false);
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

  it("a subscription invoice carries the 30-day subscription_period, a one-time one does not", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ ok: true, result: "https://t.me/$sub" }));
    await createStarsInvoiceLink({ botToken: "T", purchaseId: "s1", title: "Premium", description: "d", amount: 150, subscriptionPeriod: 2_592_000 }, fetchImpl);
    await createStarsInvoiceLink({ botToken: "T", purchaseId: "p1", title: "Premium", description: "d", amount: 150 }, fetchImpl);
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toMatchObject({ payload: "s1", currency: "XTR", subscription_period: 2_592_000 });
    expect(JSON.parse(fetchImpl.mock.calls[1][1].body)).not.toHaveProperty("subscription_period");
  });

  it("auto-renewal exists only for Premium paid with Stars inside Telegram", () => {
    expect(supportsAutoRenew("premium_month", "stars", "telegram")).toBe(true);
    expect(supportsAutoRenew("premium_month", "yookassa", "web")).toBe(false);
    expect(supportsAutoRenew("premium_month", "stars", "web")).toBe(false);
    expect(supportsAutoRenew("natal_pack", "stars", "telegram")).toBe(false);
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
});
