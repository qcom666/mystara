import nodemailer from "nodemailer";

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

type Env = Record<string, string | undefined>;

/**
 * Письма уходят через любой SMTP-сервер (Яндекс 360, Mail.ru для бизнеса, Unisender, SendPulse, почта
 * хостинга и т. д.), поэтому провайдера можно выбрать и сменить без правок кода: нужны только переменные
 * SMTP_HOST, SMTP_FROM и, как правило, SMTP_USER / SMTP_PASSWORD. SMTP_PORT по умолчанию 465 (TLS сразу);
 * для 587 (STARTTLS) укажите порт, шифрование включится само. Пока переменные не заданы, письма не
 * отправляются, а страницы восстановления пароля честно сообщают, что сервис недоступен.
 */
export function isMailConfigured(env: Env = process.env): boolean {
  return Boolean(env.SMTP_HOST && env.SMTP_FROM);
}

export function createMailer(env: Env = process.env, createTransport: typeof nodemailer.createTransport = nodemailer.createTransport): Mailer | null {
  if (!isMailConfigured(env)) return null;

  const port = Number(env.SMTP_PORT) || 465;
  const transport = createTransport({
    host: env.SMTP_HOST,
    port,
    // 465 - TLS с первого байта; на остальных портах соединение повышается командой STARTTLS, если сервер её предлагает.
    secure: port === 465,
    requireTLS: port !== 465 && env.SMTP_INSECURE !== "true",
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD ?? "" } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  return {
    async send(message) {
      await transport.sendMail({ from: env.SMTP_FROM, to: message.to, subject: message.subject, text: message.text });
    },
  };
}

let cached: { key: string; mailer: Mailer | null } | null = null;

/** Общий отправитель на экземпляр функции; пересоздаётся, если поменялись настройки. */
export function getMailer(env: Env = process.env): Mailer | null {
  const key = [env.SMTP_HOST, env.SMTP_PORT, env.SMTP_USER, env.SMTP_FROM].join("|");
  if (!cached || cached.key !== key) cached = { key, mailer: createMailer(env) };
  return cached.mailer;
}
