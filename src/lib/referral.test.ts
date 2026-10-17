import { describe, expect, it } from "vitest";
import { generateReferralCode, parseReferralCode } from "./referral";

describe("коды приглашений", () => {
  it("генерируются без похожих символов", () => {
    for (let i = 0; i < 200; i++) expect(generateReferralCode()).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
  });

  it("принимаются из ссылки и из start_param Telegram", () => {
    expect(parseReferralCode("ABCDEFGH")).toBe("ABCDEFGH");
    expect(parseReferralCode("abcdefgh")).toBe("ABCDEFGH");
    expect(parseReferralCode("ref_ABCDEFGH")).toBe("ABCDEFGH");
    for (const bad of [null, "", "ABC", "ABCDEFGHI", "ABCDEFG0", "ref_<script>", "ABCD EFGH"]) expect(parseReferralCode(bad)).toBeNull();
  });
});
