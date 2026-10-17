import { describe, expect, it } from "vitest";
import { isSessionStillValid } from "./session-check";

describe("isSessionStillValid", () => {
  it("сессия действует, пока номер поколения совпадает", () => {
    expect(isSessionStillValid(2, { deletedAt: null, sessionVersion: 2 })).toBe(true);
  });

  it("после смены поколения прежняя сессия больше не действует", () => {
    expect(isSessionStillValid(1, { deletedAt: null, sessionVersion: 2 })).toBe(false);
  });

  it("токены до появления номера считаются поколением 0", () => {
    expect(isSessionStillValid(undefined, { deletedAt: null, sessionVersion: 0 })).toBe(true);
    expect(isSessionStillValid(undefined, { deletedAt: null, sessionVersion: 1 })).toBe(false);
  });

  it("удалённый или отсутствующий пользователь не авторизован", () => {
    expect(isSessionStillValid(0, { deletedAt: new Date(), sessionVersion: 0 })).toBe(false);
    expect(isSessionStillValid(0, null)).toBe(false);
  });
});
