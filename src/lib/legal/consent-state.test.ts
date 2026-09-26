import { describe, expect, it } from "vitest";
import { parseConsent, serializeConsent } from "./consent-state";

describe("consent state", () => {
  it("round-trips accepted and declined for the current version", () => {
    expect(parseConsent(serializeConsent("accepted"))).toBe("accepted");
    expect(parseConsent(serializeConsent("declined"))).toBe("declined");
  });

  it("treats missing or malformed values as unknown", () => {
    expect(parseConsent(null)).toBe("unknown");
    expect(parseConsent("")).toBe("unknown");
    expect(parseConsent("accepted")).toBe("unknown");
    expect(parseConsent("maybe:2026-09-26", "2026-09-26")).toBe("unknown");
  });

  it("asks again when the policy version changes", () => {
    const stored = serializeConsent("accepted", "2026-01-01");
    expect(parseConsent(stored, "2026-01-01")).toBe("accepted");
    expect(parseConsent(stored, "2026-06-01")).toBe("unknown");
  });
});
