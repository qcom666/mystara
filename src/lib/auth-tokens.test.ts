import { describe, expect, it } from "vitest";
import { generateToken, hashToken } from "./auth-tokens";

describe("auth-tokens", () => {
  it("токены случайные, длинные и безопасны для адреса", () => {
    const a = generateToken();
    expect(a).not.toBe(generateToken());
    expect(a.length).toBeGreaterThanOrEqual(43);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("хеш стабилен, не равен токену и не раскрывает его", () => {
    const token = generateToken();
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toContain(token);
    expect(hashToken(token)).toMatch(/^[0-9a-f]{64}$/);
  });
});
