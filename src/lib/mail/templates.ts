import type { MailMessage } from "./mailer";

/**
 * Тексты писем на русском и английском в одном письме: язык интерфейса у пользователя в базе не
 * хранится надёжно (колонка `language` по умолчанию "en"), а два коротких блока читаются без
 * догадок о языке.
 */

export function passwordResetMessage(to: string, link: string): MailMessage {
  return {
    to,
    subject: "Восстановление пароля Mystara / Mystara password reset",
    text: [
      "Вы (или кто-то другой) запросили восстановление пароля в Mystara.",
      `Чтобы задать новый пароль, откройте ссылку (действует 1 час, работает один раз):`,
      link,
      "Если вы ничего не запрашивали, просто проигнорируйте это письмо: пароль не изменится.",
      "",
      "——",
      "",
      "A password reset was requested for your Mystara account.",
      "Open this link to set a new password (valid for 1 hour, works once):",
      link,
      "If you didn't ask for this, ignore this e-mail: your password stays the same.",
    ].join("\n"),
  };
}

export function emailVerificationMessage(to: string, link: string): MailMessage {
  return {
    to,
    subject: "Подтверждение e-mail в Mystara / Confirm your Mystara e-mail",
    text: [
      "Подтвердите адрес электронной почты для аккаунта Mystara, открыв ссылку (действует 24 часа):",
      link,
      "Если вы не регистрировались в Mystara, проигнорируйте это письмо.",
      "",
      "——",
      "",
      "Confirm the e-mail address of your Mystara account by opening this link (valid for 24 hours):",
      link,
      "If you didn't sign up for Mystara, ignore this e-mail.",
    ].join("\n"),
  };
}

export function renewalReminderMessage(to: string, params: { dateRu: string; dateEn: string; linkRu: string; linkEn: string }): MailMessage {
  return {
    to,
    subject: "Premium в Mystara скоро закончится / Your Mystara Premium ends soon",
    text: [
      `Ваш Premium в Mystara действует до ${params.dateRu}.`,
      "Автоматических списаний нет: чтобы не потерять безлимитные расклады и натальную карту раз в неделю, продлите подписку заранее. Оставшиеся дни сохранятся и сложатся с новыми.",
      params.linkRu,
      "",
      "——",
      "",
      `Your Mystara Premium is active until ${params.dateEn}.`,
      "There are no automatic charges: renew in advance to keep unlimited readings and a weekly Natal Chart. The days you have left carry over.",
      params.linkEn,
    ].join("\n"),
  };
}
