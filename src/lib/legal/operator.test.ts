import { afterEach, describe, expect, it, vi } from "vitest";

/** OPERATOR читает окружение при загрузке модуля, поэтому для каждого случая модуль загружается заново. */
async function loadOperator(env: Record<string, string>) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  return (await import("./operator")).OPERATOR;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("OPERATOR.phone", () => {
  it.each(["+79624540015", "8 (962) 454-00-15", "7 962 454 00 15", " +7-962-454-00-15 "])(
    "приводит %j к единому виду и собирает ссылку tel:",
    async (raw) => {
      const operator = await loadOperator({ NEXT_PUBLIC_OPERATOR_PHONE: raw });
      expect(operator.phone).toBe("+7 962 454-00-15");
      expect(operator.phoneUrl).toBe("tel:+79624540015");
    },
  );

  it.each(["", "12345", "+1 202 555 0100", "не номер"])("считает %j незаданным номером", async (raw) => {
    const operator = await loadOperator({ NEXT_PUBLIC_OPERATOR_PHONE: raw });
    expect(operator.phone).toBe("");
    expect(operator.phoneUrl).toBe("");
  });
});

describe("OPERATOR.telegram", () => {
  it("подставляет @ и собирает ссылку на аккаунт поддержки", async () => {
    const operator = await loadOperator({ NEXT_PUBLIC_OPERATOR_TELEGRAM: "Mystara_Support" });
    expect(operator.telegram).toBe("@Mystara_Support");
    expect(operator.telegramUrl).toBe("https://t.me/Mystara_Support");
  });
});
