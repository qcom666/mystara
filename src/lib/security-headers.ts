/**
 * Заголовки безопасности для всех ответов сайта (подключаются в next.config.ts).
 *
 * Политика CSP намеренно ограничена директивами, которые не требуют nonce: полноценный `script-src` с
 * nonce в Next.js возможен только при динамическом рендеринге каждой страницы, а у нас страницы карт и
 * раскладов собираются статически. Поэтому здесь запрещено то, что не используется вовсе (плагины,
 * подмена `<base>`), и разрешено встраивание только в собственный сайт и в веб-клиенты Telegram: Telegram
 * Web открывает Mini App во фрейме, и запрет фреймов сломал бы его. По той же причине не ставится
 * `X-Frame-Options`, который не умеет перечислять разрешённые сайты.
 */
export const FRAME_ANCESTORS = ["'self'", "https://web.telegram.org", "https://*.web.telegram.org", "https://webk.telegram.org", "https://webz.telegram.org"];

export const SECURITY_HEADERS: { key: string; value: string }[] = [
  { key: "Content-Security-Policy", value: [`frame-ancestors ${FRAME_ANCESTORS.join(" ")}`, "object-src 'none'", "base-uri 'self'"].join("; ") },
  // Только HTTPS на год, включая поддомены. preload не включаем: его нельзя быстро отменить.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Полный адрес (с токенами из писем в строке запроса) не уходит на чужие сайты, только origin.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
];
