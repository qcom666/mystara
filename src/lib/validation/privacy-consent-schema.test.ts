import { describe, expect, it } from "vitest";
import { privacyConsentSchema } from "./reading.schema";

describe("privacyConsentSchema", () => {
  it("needs a non-empty version string", () => {
    expect(privacyConsentSchema.safeParse({ version: "2026-09-26" }).success).toBe(true);
    expect(privacyConsentSchema.safeParse({ version: "" }).success).toBe(false);
    expect(privacyConsentSchema.safeParse({}).success).toBe(false);
  });
});
