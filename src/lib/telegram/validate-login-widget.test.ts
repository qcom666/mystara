import { createHash, createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { type LoginWidgetPayload, validateTelegramLoginWidget } from "./validate-login-widget";

const BOT_TOKEN = "123456:TEST-token-for-unit-tests";
const NOW = 1_800_000_000;

/** Подписывает набор полей так, как это делает Telegram, по документированному алгоритму. */
function sign(fields: Record<string, string>, token: string = BOT_TOKEN): LoginWidgetPayload {
  const dataCheckString = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join("\n");
  const secret = createHash("sha256").update(token).digest();
  const hash = createHmac("sha256", secret).update(dataCheckString).digest("hex");
  return { ...fields, hash };
}

const baseFields = {
  id: "424242",
  first_name: "Анна",
  username: "anna_tarot",
  photo_url: "https://t.me/i/userpic/320/anna.jpg",
  auth_date: String(NOW - 30),
};

describe("validateTelegramLoginWidget", () => {
  it("принимает корректно подписанные данные и возвращает пользователя", () => {
    const result = validateTelegramLoginWidget(sign(baseFields), BOT_TOKEN, NOW);
    expect(result.valid).toBe(true);
    expect(result.user).toEqual({
      id: 424242,
      firstName: "Анна",
      lastName: undefined,
      username: "anna_tarot",
      photoUrl: "https://t.me/i/userpic/320/anna.jpg",
    });
  });

  it("отвергает данные, подписанные другим токеном", () => {
    const payload = sign(baseFields, "999:other-token");
    expect(validateTelegramLoginWidget(payload, BOT_TOKEN, NOW)).toEqual({ valid: false, reason: "hash_mismatch" });
  });

  it("отвергает подмену любого поля после подписи", () => {
    const payload = { ...sign(baseFields), id: "1" };
    expect(validateTelegramLoginWidget(payload, BOT_TOKEN, NOW).reason).toBe("hash_mismatch");
  });

  it("отвергает устаревший вход", () => {
    const payload = sign({ ...baseFields, auth_date: String(NOW - 2 * 60 * 60) });
    expect(validateTelegramLoginWidget(payload, BOT_TOKEN, NOW)).toEqual({ valid: false, reason: "expired" });
  });

  it("отвергает данные без подписи и без токена бота", () => {
    const unsigned = sign(baseFields);
    delete unsigned.hash;
    expect(validateTelegramLoginWidget(unsigned, BOT_TOKEN, NOW).reason).toBe("missing_hash");
    expect(validateTelegramLoginWidget(sign(baseFields), "", NOW).reason).toBe("bot_token_not_configured");
  });

  it("учитывает в подписи все присланные поля, в том числе новые", () => {
    expect(validateTelegramLoginWidget(sign({ ...baseFields, new_field: "x" }), BOT_TOKEN, NOW).valid).toBe(true);
  });

  it("отвергает поле, добавленное после подписи", () => {
    const payload = { ...sign(baseFields), extra: "x" };
    expect(validateTelegramLoginWidget(payload, BOT_TOKEN, NOW).reason).toBe("hash_mismatch");
  });

  it("отвергает нечисловой идентификатор", () => {
    const payload = sign({ ...baseFields, id: "abc" });
    expect(validateTelegramLoginWidget(payload, BOT_TOKEN, NOW).reason).toBe("invalid_id");
  });
});
