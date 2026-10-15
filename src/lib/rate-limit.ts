import { NextResponse } from "next/server";

/**
 * Ограничение частоты запросов к API: не больше `limit` запросов за `windowSeconds` с одного адреса.
 *
 * Счётчики хранятся в памяти экземпляра функции. На Vercel экземпляров может быть несколько, и каждый
 * считает отдельно, поэтому защита рассчитана на обычный перебор и случайные всплески, а не на
 * распределённую атаку: для неё нужны правила файрвола хостинга. Зато она не требует внешнего
 * сервиса и не отправляет адреса посетителей за пределы РФ.
 */

export interface RateLimitRule {
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const MAX_BUCKETS = 10_000;
const SWEEP_INTERVAL_MS = 60_000;

export function createRateLimiter(now: () => number = Date.now) {
  const buckets = new Map<string, Bucket>();
  let lastSweep = now();

  function sweep(current: number) {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= current) buckets.delete(key);
    }
    lastSweep = current;
  }

  function check(key: string, rule: RateLimitRule): RateLimitResult {
    const current = now();
    if (current - lastSweep >= SWEEP_INTERVAL_MS || buckets.size >= MAX_BUCKETS) sweep(current);
    // Если после чистки всё ещё слишком много записей, освобождаем самые старые: память важнее точности.
    while (buckets.size >= MAX_BUCKETS) {
      const oldest = buckets.keys().next().value;
      if (oldest === undefined) break;
      buckets.delete(oldest);
    }

    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= current) {
      bucket = { count: 0, resetAt: current + rule.windowSeconds * 1000 };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - current) / 1000));
    if (bucket.count > rule.limit) return { allowed: false, remaining: 0, retryAfterSeconds };
    return { allowed: true, remaining: rule.limit - bucket.count, retryAfterSeconds };
  }

  return { check };
}

/** Адрес клиента за прокси хостинга; без заголовков все клиенты попадают в одну общую корзину. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}

const sharedLimiter = createRateLimiter();

/** Возвращает ответ 429, если лимит исчерпан, иначе null: вызывать в начале обработчика. */
export function enforceRateLimit(request: Request, name: string, rule: RateLimitRule): NextResponse | null {
  const result = sharedLimiter.check(`${name}:${clientIp(request)}`, rule);
  if (result.allowed) return null;
  return NextResponse.json(
    { error: "rate_limited", retryAfterSeconds: result.retryAfterSeconds },
    { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } },
  );
}
