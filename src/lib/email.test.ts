import { describe, expect, it } from "vitest";
import { emailField, emailWhere, normalizeEmail } from "./email";
import { signupSchema } from "./validation/reading.schema";

describe("единый вид e-mail", () => {
  it("убирает пробелы по краям и приводит к нижнему регистру", () => {
    expect(normalizeEmail("  Anna.Ivanova@Mail.RU ")).toBe("anna.ivanova@mail.ru");
  });

  it("поле формы сразу нормализует адрес и проверяет формат", () => {
    expect(emailField.parse(" Test@Example.COM ")).toBe("test@example.com");
    expect(emailField.safeParse("не-почта").success).toBe(false);
  });

  it("регистрация сохраняет адрес в нижнем регистре", () => {
    const parsed = signupSchema.parse({ name: "Анна", email: "Anna@Mail.ru", password: "long-enough-1", acceptPrivacy: true });
    expect(parsed.email).toBe("anna@mail.ru");
  });

  it("поиск без учёта регистра", () => {
    expect(emailWhere(" Anna@Mail.ru")).toEqual({ email: { equals: "anna@mail.ru", mode: "insensitive" } });
  });
});
