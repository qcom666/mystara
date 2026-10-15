/**
 * Журнал ошибок сервера: одна строка JSON на событие, чтобы логи хостинга можно было искать и
 * фильтровать. В `context` кладите только технические поля (идентификаторы заказов, коды), но не имена,
 * вопросы, даты рождения и другие персональные данные.
 */
export function logError(scope: string, error: unknown, context: Record<string, string | number | boolean | null> = {}): void {
  const detail =
    error instanceof Error ? { message: error.message, stack: error.stack?.split("\n").slice(0, 6).join("\n") } : { message: String(error) };
  console.error(JSON.stringify({ level: "error", time: new Date().toISOString(), scope, ...detail, ...context }));
}

export function logWarning(scope: string, message: string, context: Record<string, string | number | boolean | null> = {}): void {
  console.warn(JSON.stringify({ level: "warn", time: new Date().toISOString(), scope, message, ...context }));
}
