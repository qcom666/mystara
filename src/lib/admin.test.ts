import { describe, expect, it } from "vitest";
import { hasConfiguredAdmins, isAdminAccount } from "./admin";

const account = { id: "cmv1abc", telegramId: null };

describe("isAdminAccount", () => {
  it("nobody is an admin until admins are configured", () => {
    expect(isAdminAccount(account, {})).toBe(false);
    expect(isAdminAccount(account, { ADMIN_USER_IDS: "", ADMIN_TELEGRAM_IDS: "  " })).toBe(false);
  });

  it("recognizes an account by its internal id, with any separators and whitespace", () => {
    expect(isAdminAccount(account, { ADMIN_USER_IDS: "cmv1abc" })).toBe(true);
    expect(isAdminAccount(account, { ADMIN_USER_IDS: " other , cmv1abc ;third" })).toBe(true);
    expect(isAdminAccount(account, { ADMIN_USER_IDS: "other\ncmv1abc" })).toBe(true);
  });

  it("does not match by prefix, substring or case", () => {
    expect(isAdminAccount(account, { ADMIN_USER_IDS: "cmv1ab" })).toBe(false);
    expect(isAdminAccount(account, { ADMIN_USER_IDS: "cmv1abcd" })).toBe(false);
    expect(isAdminAccount(account, { ADMIN_USER_IDS: "CMV1ABC" })).toBe(false);
  });

  it("recognizes an account by its Telegram id, but only when it has one", () => {
    const telegramUser = { id: "u2", telegramId: "123456789" };
    expect(isAdminAccount(telegramUser, { ADMIN_TELEGRAM_IDS: "111,123456789" })).toBe(true);
    expect(isAdminAccount(telegramUser, { ADMIN_TELEGRAM_IDS: "12345678" })).toBe(false);
    expect(isAdminAccount({ id: "u3", telegramId: null }, { ADMIN_TELEGRAM_IDS: "null" })).toBe(false);
  });

  it("never treats the user id list as Telegram ids or the other way round", () => {
    expect(isAdminAccount({ id: "123456789", telegramId: null }, { ADMIN_TELEGRAM_IDS: "123456789" })).toBe(false);
    expect(isAdminAccount({ id: "u", telegramId: "cmv1abc" }, { ADMIN_USER_IDS: "cmv1abc" })).toBe(false);
  });
});

describe("hasConfiguredAdmins", () => {
  it("is true only when at least one id is set", () => {
    expect(hasConfiguredAdmins({})).toBe(false);
    expect(hasConfiguredAdmins({ ADMIN_USER_IDS: " , " })).toBe(false);
    expect(hasConfiguredAdmins({ ADMIN_USER_IDS: "a" })).toBe(true);
    expect(hasConfiguredAdmins({ ADMIN_TELEGRAM_IDS: "1" })).toBe(true);
  });
});
