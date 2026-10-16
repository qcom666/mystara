/**
 * Публичный адрес сайта для ссылок в письмах. Берётся из NEXT_PUBLIC_SITE_URL; адрес запроса используется
 * лишь как запасной вариант (заголовку Host из запроса не доверяем, пока есть настроенный адрес).
 */
export function getSiteUrl(request?: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (configured) return configured;
  return request ? new URL(request.url).origin : "http://localhost:3000";
}
