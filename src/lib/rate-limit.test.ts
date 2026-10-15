import { describe, expect, it } from "vitest";
import { clientIp, createRateLimiter } from "./rate-limit";

const rule = { limit: 3, windowSeconds: 60 };

function clock(start = 1_000_000) {
  let value = start;
  return { now: () => value, advance: (ms: number) => (value += ms) };
}

describe("createRateLimiter", () => {
  it("пропускает запросы до лимита и отклоняет следующие", () => {
    const time = clock();
    const limiter = createRateLimiter(time.now);
    expect([1, 2, 3].map(() => limiter.check("a", rule).allowed)).toEqual([true, true, true]);
    const blocked = limiter.check("a", rule);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("считает отдельно по каждому ключу", () => {
    const limiter = createRateLimiter(clock().now);
    for (let i = 0; i < 3; i++) limiter.check("a", rule);
    expect(limiter.check("a", rule).allowed).toBe(false);
    expect(limiter.check("b", rule).allowed).toBe(true);
  });

  it("сбрасывает счётчик по окончании окна", () => {
    const time = clock();
    const limiter = createRateLimiter(time.now);
    for (let i = 0; i < 4; i++) limiter.check("a", rule);
    expect(limiter.check("a", rule).allowed).toBe(false);
    time.advance(61_000);
    expect(limiter.check("a", rule).allowed).toBe(true);
  });

  it("сообщает, сколько секунд осталось ждать", () => {
    const time = clock();
    const limiter = createRateLimiter(time.now);
    for (let i = 0; i < 3; i++) limiter.check("a", rule);
    time.advance(20_000);
    expect(limiter.check("a", rule).retryAfterSeconds).toBe(40);
  });
});

describe("clientIp", () => {
  it("берёт первый адрес из x-forwarded-for", () => {
    const request = new Request("http://x.test", { headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" } });
    expect(clientIp(request)).toBe("203.0.113.5");
  });

  it("без заголовков возвращает общий ключ", () => {
    expect(clientIp(new Request("http://x.test"))).toBe("unknown");
  });
});
