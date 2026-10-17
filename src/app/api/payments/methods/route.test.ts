import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const call = async (query: string) => (await GET(new Request(`https://site.test/api/payments/methods?${query}`))).json();

beforeEach(() => {
  vi.stubEnv("TELEGRAM_BOT_TOKEN", "t");
  vi.stubEnv("YOOKASSA_SHOP_ID", "1");
  vi.stubEnv("YOOKASSA_SECRET_KEY", "k");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/payments/methods", () => {
  it("prices the natal chart pack by default", async () => {
    expect(await call("context=web")).toEqual({ methods: [{ id: "yookassa", price: { amount: 1000, currency: "RUB" } }] });
    expect(await call("context=telegram")).toEqual({ methods: [{ id: "stars", price: { amount: 500, currency: "XTR" } }] });
  });

  it("prices Premium when asked for it, in each provider's currency", async () => {
    expect(await call("context=web&product=premium_month")).toEqual({ methods: [{ id: "yookassa", price: { amount: 300, currency: "RUB" } }] });
    expect(await call("context=telegram&product=premium_month")).toEqual({ methods: [{ id: "stars", price: { amount: 150, currency: "XTR" }, autoRenew: true }] });
  });

  it("offers auto-renewal only for Premium in Telegram", async () => {
    expect(await call("context=web&product=premium_month")).not.toHaveProperty("methods.0.autoRenew");
    expect(await call("context=telegram&product=natal_pack")).not.toHaveProperty("methods.0.autoRenew");
  });

  it("falls back to the pack for an unknown product", async () => {
    expect(await call("context=web&product=gold")).toEqual({ methods: [{ id: "yookassa", price: { amount: 1000, currency: "RUB" } }] });
  });

  it("offers nothing until the provider's credentials are set", async () => {
    vi.stubEnv("YOOKASSA_SECRET_KEY", "");
    expect(await call("context=web&product=premium_month")).toEqual({ methods: [] });
  });
});
