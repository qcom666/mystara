import { randomInt } from "node:crypto";

/**
 * Приглашения друзей. У каждого аккаунта свой короткий код; ссылка на сайт `/?ref=КОД`, ссылка на Mini App
 * `t.me/<бот>?startapp=ref_КОД` (Telegram передаёт её в подписанных данных запуска). Пригласивший получает
 * бонус один раз за каждого приглашённого, после его первой оплаты.
 */

/** Без похожих символов (0/O, 1/I/L), чтобы код можно было продиктовать. */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const REFERRAL_CODE_LENGTH = 8;
/** Сколько кредитов натальной карты получает пригласивший за первую оплату приглашённого. */
export const REFERRAL_REWARD_CREDITS = 1;

export function generateReferralCode(): string {
  let code = "";
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}

/** Код из параметра ссылки или из start_param Telegram («ref_КОД»); всё постороннее отбрасывается. */
export function parseReferralCode(value: string | null | undefined): string | null {
  if (!value) return null;
  const code = value.trim().replace(/^ref_/i, "").toUpperCase();
  return new RegExp(`^[${ALPHABET}]{${REFERRAL_CODE_LENGTH}}$`).test(code) ? code : null;
}
