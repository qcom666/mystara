import { describe, expect, it } from "vitest";
import { canStartReading } from "./usage-limit.service";

const freeSpread = { isPremium: false, category: "general" as const };
const premiumSpread = { isPremium: true, category: "general" as const };

describe("canStartReading", () => {
  it("allows a free-plan user under the daily limit", () => {
    expect(canStartReading({ planTier: "free", spread: freeSpread, readingsToday: 0 }).allowed).toBe(true);
  });

  it("blocks a free-plan user at the daily limit", () => {
    const result = canStartReading({ planTier: "free", spread: freeSpread, readingsToday: 3 });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/limit/i);
  });

  it("blocks a free-plan user from a premium spread even under the daily limit", () => {
    const result = canStartReading({ planTier: "free", spread: premiumSpread, readingsToday: 0 });
    expect(result.allowed).toBe(false);
  });

  it("allows a premium-plan user effectively unlimited readings", () => {
    expect(canStartReading({ planTier: "premium", spread: freeSpread, readingsToday: 500 }).allowed).toBe(true);
  });

  it("allows a premium-plan user to start a premium spread", () => {
    expect(canStartReading({ planTier: "premium", spread: premiumSpread, readingsToday: 0 }).allowed).toBe(true);
  });
});
