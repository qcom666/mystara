import { createHash, randomBytes } from "node:crypto";

/**
 * Одноразовые токены для ссылок из писем (сброс пароля, подтверждение e-mail). В письмо уходит случайный
 * токен на 256 бит, а в базе хранится только его SHA-256: утечка таблицы не даёт готовых ссылок.
 */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Сколько живёт ссылка из письма. */
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
export const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
