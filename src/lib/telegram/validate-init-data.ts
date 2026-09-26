import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Validates Telegram Mini App `initData` per Telegram's documented algorithm:
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 *   secret_key    = HMAC_SHA256(key="WebAppData", data=<bot token>)
 *   data_check_string = all initData fields except `hash`, sorted by key,
 *                        formatted "key=value", joined with "\n"
 *   computed_hash = HMAC_SHA256(key=secret_key, data=data_check_string), hex
 *
 * `computed_hash` must equal the `hash` field, and `auth_date` must be recent
 * (otherwise a captured initData string could be replayed indefinitely).
 * This is the ONLY thing that proves a client-supplied initData string
 * actually came from Telegram — never trust it without this check.
 */

const MAX_INIT_DATA_AGE_SECONDS = 24 * 60 * 60;

export interface ValidatedTelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  languageCode?: string;
}

export interface ValidateInitDataResult {
  valid: boolean;
  user?: ValidatedTelegramUser;
  reason?: string;
}

export function validateTelegramInitData(initData: string, botToken: string): ValidateInitDataResult {
  if (!initData) return { valid: false, reason: "empty_init_data" };
  if (!botToken) return { valid: false, reason: "bot_token_not_configured" };

  let params: URLSearchParams;
  try {
    params = new URLSearchParams(initData);
  } catch {
    return { valid: false, reason: "malformed_init_data" };
  }

  const hash = params.get("hash");
  if (!hash) return { valid: false, reason: "missing_hash" };
  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const computedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  const hashBuffer = Buffer.from(hash, "hex");
  const computedBuffer = Buffer.from(computedHash, "hex");
  const hashesMatch = hashBuffer.length === computedBuffer.length && timingSafeEqual(hashBuffer, computedBuffer);
  if (!hashesMatch) return { valid: false, reason: "hash_mismatch" };

  const authDate = Number(params.get("auth_date"));
  if (!authDate || Date.now() / 1000 - authDate > MAX_INIT_DATA_AGE_SECONDS) {
    return { valid: false, reason: "expired" };
  }

  const userJson = params.get("user");
  if (!userJson) return { valid: false, reason: "missing_user" };

  try {
    const rawUser = JSON.parse(userJson) as {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      photo_url?: string;
      language_code?: string;
    };
    return {
      valid: true,
      user: {
        id: rawUser.id,
        firstName: rawUser.first_name,
        lastName: rawUser.last_name,
        username: rawUser.username,
        photoUrl: rawUser.photo_url,
        languageCode: rawUser.language_code,
      },
    };
  } catch {
    return { valid: false, reason: "invalid_user_json" };
  }
}
