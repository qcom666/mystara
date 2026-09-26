import { describe, expect, it } from "vitest";
import { privacyConsentSchema, signupSchema } from "./reading.schema";

const valid = { name: "Anna", email: "anna@example.com", password: "long-enough-1" };

describe("signupSchema consent", () => {
  it("accepts a sign-up that ticked the consent box", () => {
    expect(signupSchema.safeParse({ ...valid, acceptPrivacy: true }).success).toBe(true);
  });

  it("rejects a sign-up without consent — missing, false, or truthy-but-not-true", () => {
    expect(signupSchema.safeParse(valid).success).toBe(false);
    expect(signupSchema.safeParse({ ...valid, acceptPrivacy: false }).success).toBe(false);
    expect(signupSchema.safeParse({ ...valid, acceptPrivacy: "true" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...valid, acceptPrivacy: 1 }).success).toBe(false);
  });
});

describe("privacyConsentSchema", () => {
  it("needs a non-empty version string", () => {
    expect(privacyConsentSchema.safeParse({ version: "2026-09-26" }).success).toBe(true);
    expect(privacyConsentSchema.safeParse({ version: "" }).success).toBe(false);
    expect(privacyConsentSchema.safeParse({}).success).toBe(false);
  });
});
