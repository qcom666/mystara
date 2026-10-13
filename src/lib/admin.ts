/**
 * Кто является администратором. Права выдаются только списками в переменных окружения, а не полем в базе:
 * так их нельзя получить ни регистрацией, ни ошибкой в интерфейсе, а чтобы добавить или убрать
 * администратора, нужно изменить настройки на Vercel.
 *
 *  - `ADMIN_USER_IDS`      внутренние идентификаторы аккаунтов (показаны в личном кабинете);
 *  - `ADMIN_TELEGRAM_IDS`  числовые идентификаторы Telegram: подлинность аккаунта подтверждается подписью
 *                          Telegram (см. validate-init-data.ts).
 *
 * По e-mail администратора определять нельзя: подтверждения почты в сервисе нет, и чужой адрес мог бы
 * зарегистрировать кто угодно.
 */

type Env = Record<string, string | undefined>;

function parseIds(raw: string | undefined): Set<string> {
  return new Set((raw ?? "").split(/[\s,;]+/).filter(Boolean));
}

export interface AdminCandidate {
  id: string;
  telegramId: string | null;
}

export function isAdminAccount(account: AdminCandidate, env: Env = process.env): boolean {
  if (parseIds(env.ADMIN_USER_IDS).has(account.id)) return true;
  return account.telegramId !== null && parseIds(env.ADMIN_TELEGRAM_IDS).has(account.telegramId);
}

/** true, если администраторы вообще настроены: без настройки админ-панель недоступна никому. */
export function hasConfiguredAdmins(env: Env = process.env): boolean {
  return parseIds(env.ADMIN_USER_IDS).size > 0 || parseIds(env.ADMIN_TELEGRAM_IDS).size > 0;
}
