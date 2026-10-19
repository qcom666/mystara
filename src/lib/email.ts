import { z } from "zod";

/**
 * Адрес e-mail в одном виде для хранения и поиска: без пробелов по краям и в нижнем регистре. Иначе
 * «Anna@Mail.ru» и «anna@mail.ru» стали бы двумя аккаунтами, а войти можно было бы только тем написанием,
 * которым адрес набрали при регистрации.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Поле e-mail в формах: сразу приводится к единому виду, потом проверяется формат. */
export const emailField = z.string().trim().toLowerCase().email().max(254);

/** Условие поиска пользователя по адресу без учёта регистра (на случай старых записей с заглавными буквами). */
export function emailWhere(email: string) {
  return { email: { equals: normalizeEmail(email), mode: "insensitive" as const } };
}
