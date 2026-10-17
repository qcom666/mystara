import { describe, expect, it } from "vitest";
import { SECURITY_HEADERS } from "./security-headers";

const header = (key: string) => SECURITY_HEADERS.find((item) => item.key === key)?.value ?? "";

describe("SECURITY_HEADERS", () => {
  it("разрешает встраивание только в свой сайт и в веб-клиенты Telegram", () => {
    const csp = header("Content-Security-Policy");
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).toContain("https://web.telegram.org");
    expect(csp).not.toContain("frame-ancestors *");
  });

  it("не ставит X-Frame-Options: он сломал бы Mini App в Telegram Web", () => {
    expect(SECURITY_HEADERS.some((item) => item.key.toLowerCase() === "x-frame-options")).toBe(false);
  });

  it("не ограничивает скрипты: без nonce это сломало бы статические страницы и виджет Telegram", () => {
    expect(header("Content-Security-Policy")).not.toMatch(/script-src|default-src/);
  });

  it("включает HSTS, nosniff и безопасную политику Referer", () => {
    expect(header("Strict-Transport-Security")).toMatch(/max-age=\d{7,}/);
    expect(header("X-Content-Type-Options")).toBe("nosniff");
    expect(header("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });
});
