import { describe, expect, it } from "vitest";
import {
  PREMIUM_NATAL_CHART_INTERVAL_DAYS,
  PREMIUM_PERIOD_DAYS,
  STARS_SUBSCRIPTION_PERIOD_SECONDS,
  estimateSubscriptionExpiration,
  extendPremiumPeriodEnd,
  isPremiumActive,
  premiumEndAfterSubscriptionCharge,
  weeklyNatalChartAllowance,
  type SubscriptionSnapshot,
} from "./premium";

const DAY = 24 * 60 * 60 * 1000;
const now = new Date("2026-10-13T12:00:00Z");
const inDays = (days: number) => new Date(now.getTime() + days * DAY);

const active = (end: Date | null): SubscriptionSnapshot => ({ tier: "PREMIUM", status: "ACTIVE", currentPeriodEnd: end });

describe("isPremiumActive", () => {
  it("is active while the paid period has not ended", () => {
    expect(isPremiumActive(active(inDays(1)), now)).toBe(true);
  });

  it("ends exactly when the period ends", () => {
    expect(isPremiumActive(active(now), now)).toBe(false);
    expect(isPremiumActive(active(inDays(-1)), now)).toBe(false);
  });

  it("is not active without a subscription, on the free tier, with another status or without an end date", () => {
    expect(isPremiumActive(null, now)).toBe(false);
    expect(isPremiumActive({ tier: "FREE", status: "ACTIVE", currentPeriodEnd: inDays(5) }, now)).toBe(false);
    expect(isPremiumActive({ tier: "PREMIUM", status: "CANCELED", currentPeriodEnd: inDays(5) }, now)).toBe(false);
    expect(isPremiumActive({ tier: "PREMIUM", status: "PAST_DUE", currentPeriodEnd: inDays(5) }, now)).toBe(false);
    expect(isPremiumActive(active(null), now)).toBe(false);
  });
});

describe("extendPremiumPeriodEnd", () => {
  it("counts the period from the payment when there is no active Premium", () => {
    expect(extendPremiumPeriodEnd(null, now)).toEqual(inDays(PREMIUM_PERIOD_DAYS));
    expect(extendPremiumPeriodEnd(inDays(-3), now)).toEqual(inDays(PREMIUM_PERIOD_DAYS));
  });

  it("adds the new period to the end of the running one, so paid days are not lost", () => {
    expect(extendPremiumPeriodEnd(inDays(10), now)).toEqual(inDays(10 + PREMIUM_PERIOD_DAYS));
  });

  it("accepts a custom number of days", () => {
    expect(extendPremiumPeriodEnd(null, now, 7)).toEqual(inDays(7));
  });
});

describe("weeklyNatalChartAllowance", () => {
  it("is never available without Premium", () => {
    expect(weeklyNatalChartAllowance(false, null, now)).toEqual({ available: false, nextAvailableAt: null });
    expect(weeklyNatalChartAllowance(false, inDays(-30), now)).toEqual({ available: false, nextAvailableAt: null });
  });

  it("is available for a subscriber who has not used it yet", () => {
    expect(weeklyNatalChartAllowance(true, null, now)).toEqual({ available: true, nextAvailableAt: null });
  });

  it("is blocked until the interval after the last chart has passed, then reports when it frees up", () => {
    const last = inDays(-2);
    const result = weeklyNatalChartAllowance(true, last, now);
    expect(result.available).toBe(false);
    expect(result.nextAvailableAt).toEqual(new Date(last.getTime() + PREMIUM_NATAL_CHART_INTERVAL_DAYS * DAY));
  });

  it("frees up exactly when the interval is over", () => {
    expect(weeklyNatalChartAllowance(true, inDays(-PREMIUM_NATAL_CHART_INTERVAL_DAYS), now)).toEqual({
      available: true,
      nextAvailableAt: null,
    });
    expect(weeklyNatalChartAllowance(true, new Date(inDays(-PREMIUM_NATAL_CHART_INTERVAL_DAYS).getTime() + 1), now).available).toBe(false);
  });
});

describe("срок Premium по подписке Звёздами", () => {
  it("период подписки — те же 30 дней, что и у Premium (Telegram требует 2592000 секунд)", () => {
    expect(STARS_SUBSCRIPTION_PERIOD_SECONDS).toBe(2_592_000);
    expect(STARS_SUBSCRIPTION_PERIOD_SECONDS * 1000).toBe(PREMIUM_PERIOD_DAYS * DAY);
  });

  it("без других оплаченных дней Premium действует ровно до срока подписки у Telegram", () => {
    expect(premiumEndAfterSubscriptionCharge({ currentPeriodEnd: null, previousExpiration: null, expiresAt: inDays(30), now })).toEqual(inDays(30));
    // Продление пришло, когда прежний срок уже истёк (вебхук задержался): срок всё равно по Telegram.
    expect(premiumEndAfterSubscriptionCharge({ currentPeriodEnd: inDays(-0.01), previousExpiration: inDays(-0.01), expiresAt: inDays(29.99), now })).toEqual(inDays(29.99));
  });

  it("дни разовой оплаты, промокода или администратора сохраняются и прибавляются", () => {
    // Первая оплата при 10 оставшихся днях: +30.
    expect(premiumEndAfterSubscriptionCharge({ currentPeriodEnd: inDays(10), previousExpiration: null, expiresAt: inDays(30), now })).toEqual(inDays(40));
    // Продление: Telegram сдвинул срок на 30 дней, запас в 10 дней остаётся.
    expect(premiumEndAfterSubscriptionCharge({ currentPeriodEnd: inDays(10), previousExpiration: inDays(0), expiresAt: inDays(30), now })).toEqual(inDays(40));
  });

  it("старое списание, найденное после нового, срок не сдвигает", () => {
    expect(premiumEndAfterSubscriptionCharge({ currentPeriodEnd: inDays(60), previousExpiration: inDays(60), expiresAt: inDays(30), now })).toEqual(inDays(60));
  });

  it("без срока от Telegram он выводится из прежнего срока или момента списания", () => {
    expect(estimateSubscriptionExpiration(null, now)).toEqual(inDays(30));
    expect(estimateSubscriptionExpiration(inDays(0.5), now)).toEqual(inDays(30.5));
    expect(estimateSubscriptionExpiration(inDays(-1), now)).toEqual(inDays(30));
  });
});
