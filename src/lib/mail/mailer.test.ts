import { describe, expect, it, vi } from "vitest";
import { createMailer, isMailConfigured } from "./mailer";
import { emailVerificationMessage, passwordResetMessage } from "./templates";

describe("isMailConfigured", () => {
  it("почта считается настроенной только при хосте и адресе отправителя", () => {
    expect(isMailConfigured({})).toBe(false);
    expect(isMailConfigured({ SMTP_HOST: "smtp.example.ru" })).toBe(false);
    expect(isMailConfigured({ SMTP_HOST: "smtp.example.ru", SMTP_FROM: "Mystara <no-reply@example.ru>" })).toBe(true);
  });
});

describe("createMailer", () => {
  const sendMail = vi.fn().mockResolvedValue({});

  it("без настроек возвращает null: письма не отправляются", () => {
    expect(createMailer({}, vi.fn())).toBeNull();
  });

  it("порт 465: TLS сразу, логин и пароль из окружения", async () => {
    const createTransport = vi.fn().mockReturnValue({ sendMail });
    const mailer = createMailer(
      { SMTP_HOST: "smtp.example.ru", SMTP_FROM: "Mystara <no-reply@example.ru>", SMTP_USER: "u", SMTP_PASSWORD: "p" },
      createTransport as never,
    );
    expect(createTransport).toHaveBeenCalledWith(expect.objectContaining({ host: "smtp.example.ru", port: 465, secure: true, auth: { user: "u", pass: "p" } }));
    await mailer!.send({ to: "a@example.com", subject: "Тема", text: "Текст" });
    expect(sendMail).toHaveBeenCalledWith({ from: "Mystara <no-reply@example.ru>", to: "a@example.com", subject: "Тема", text: "Текст" });
  });

  it("порт 587: STARTTLS обязателен, если явно не разрешено иное", () => {
    const createTransport = vi.fn().mockReturnValue({ sendMail });
    createMailer({ SMTP_HOST: "h", SMTP_FROM: "f@example.ru", SMTP_PORT: "587" }, createTransport as never);
    expect(createTransport).toHaveBeenCalledWith(expect.objectContaining({ port: 587, secure: false, requireTLS: true }));
  });
});

describe("шаблоны писем", () => {
  it("содержат ссылку, русский и английский текст", () => {
    for (const message of [passwordResetMessage("a@example.com", "https://site.test/x?token=t"), emailVerificationMessage("a@example.com", "https://site.test/x?token=t")]) {
      expect(message.to).toBe("a@example.com");
      expect(message.text).toContain("https://site.test/x?token=t");
      expect(message.text).toMatch(/[А-Яа-я]/);
      expect(message.text).toMatch(/[A-Za-z]{4}/);
      expect(message.subject).toContain("/");
    }
  });
});
