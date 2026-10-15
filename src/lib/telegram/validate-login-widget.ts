import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { ValidateInitDataResult } from "./validate-init-data";

/**
 * Проверяет данные «Входа через Telegram» (Login Widget) для обычного сайта вне мини-приложения:
 * https://core.telegram.org/widgets/login#checking-authorization
 *
 *   secret_key        = SHA256(<токен бота>)
 *   data_check_string = все поля, кроме `hash`, по алфавиту, в виде "key=value", через "\n"
 *   computed_hash     = HMAC_SHA256(key=secret_key, data=data_check_string), hex
 *
 * Отличие от `initData` мини-приложения (validate-init-data.ts) только в способе получить секретный
 * ключ и в плоском наборе полей. Подпись доказывает, что данные выдал Telegram; свежесть `auth_date`
 * не даёт воспроизвести перехваченный ответ позже.
 */

const MAX_AUTH_AGE_SECONDS = 60 * 60;

/** Поля ответа виджета: подпись считается по всем полученным полям, кроме `hash`, а не по известному списку. */
export type LoginWidgetPayload = Record<string, string | undefined>;

export function validateTelegramLoginWidget(
  payload: LoginWidgetPayload,
  botToken: string,
  nowSeconds: number = Date.now() / 1000,
): ValidateInitDataResult {
  if (!botToken) return { valid: false, reason: "bot_token_not_configured" };
  if (!payload.hash) return { valid: false, reason: "missing_hash" };
  if (!payload.id || !payload.auth_date) return { valid: false, reason: "missing_fields" };

  const dataCheckString = Object.entries(payload)
    .filter((entry): entry is [string, string] => entry[0] !== "hash" && entry[1] !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = createHash("sha256").update(botToken).digest();
  const computedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  const hashBuffer = Buffer.from(payload.hash, "hex");
  const computedBuffer = Buffer.from(computedHash, "hex");
  const hashesMatch = hashBuffer.length === computedBuffer.length && timingSafeEqual(hashBuffer, computedBuffer);
  if (!hashesMatch) return { valid: false, reason: "hash_mismatch" };

  const authDate = Number(payload.auth_date);
  if (!authDate || nowSeconds - authDate > MAX_AUTH_AGE_SECONDS) return { valid: false, reason: "expired" };

  const id = Number(payload.id);
  if (!Number.isSafeInteger(id) || id <= 0) return { valid: false, reason: "invalid_id" };

  return {
    valid: true,
    user: {
      id,
      firstName: payload.first_name ?? "",
      lastName: payload.last_name || undefined,
      username: payload.username || undefined,
      photoUrl: payload.photo_url || undefined,
    },
  };
}
