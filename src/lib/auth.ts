import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { isDatabaseConfigured, prisma } from "./db";
import { hasConfiguredAdmins, isAdminAccount } from "./admin";
import { getAdminCandidate } from "./repositories/account.repository";
import { getSessionUserState } from "./repositories/account-deletion.repository";
import { isSessionStillValid } from "./session-check";
import { getPlanTier } from "./repositories/subscription.repository";
import { attachReferrer } from "./repositories/referral.repository";
import { upsertTelegramUser } from "./repositories/telegram-user.repository";
import { validateTelegramInitData } from "./telegram/validate-init-data";
import { validateTelegramLoginWidget } from "./telegram/validate-login-widget";
import { emailWhere, normalizeEmail } from "./email";

/** Приводит значения произвольного JSON к строкам: подпись Telegram считается по их строковому виду. */
function toStringRecord(value: unknown): Record<string, string> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const result: Record<string, string> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === "string" || typeof item === "number") result[key] = String(item);
    else if (item !== null && item !== undefined) return null;
  }
  return result;
}

// Два способа входа: e-mail и пароль, а также Telegram. Для Telegram пароля нет: учётными данными
// служит подпись Telegram.
const providers: NextAuthConfig["providers"] = [
  Credentials({
    id: "credentials",
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      // Закрываем доступ (сессии нет), а не бросаем «сырую» ошибку подключения, когда приложению
      // ещё не задан DATABASE_URL.
      if (!isDatabaseConfigured()) return null;

      const email = typeof credentials?.email === "string" ? normalizeEmail(credentials.email) : undefined;
      const password = typeof credentials?.password === "string" ? credentials.password : undefined;
      if (!email || !password) return null;

      const user = await prisma.user.findFirst({ where: emailWhere(email), orderBy: { createdAt: "asc" } });
      // Удалённый аккаунт входить не может, даже если e-mail каким-то образом остался.
      if (!user?.passwordHash || user.deletedAt) return null;

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) return null;

      return { id: user.id, name: user.name, email: user.email, image: user.image };
    },
  }),
  // Вход из Telegram Mini App: клиент присылает исходную строку `initData`, подписанную самим Telegram
  // (window.Telegram.WebApp.initData); без проверки HMAC в validateTelegramInitData ей доверять нельзя.
  Credentials({
    id: "telegram",
    name: "Telegram",
    credentials: {
      initData: { label: "initData", type: "text" },
    },
    async authorize(credentials) {
      // Закрываем доступ (сессии нет), а не бросаем «сырую» ошибку подключения, когда приложению
      // ещё не задан DATABASE_URL.
      if (!isDatabaseConfigured()) return null;

      const initData = typeof credentials?.initData === "string" ? credentials.initData : undefined;
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!initData || !botToken) return null;

      const result = validateTelegramInitData(initData, botToken);
      if (!result.valid || !result.user) return null;

      const { user, created } = await upsertTelegramUser(result.user);
      // Ссылка приглашения в Mini App приходит в подписанных данных запуска (start_param).
      if (created) await attachReferrer(user.id, result.startParam).catch(() => false);
      return { id: user.id, name: user.name, email: user.email, image: user.image };
    },
  }),
  // Вход с обычного сайта через виджет «Войти через Telegram»: клиент присылает ответ виджета целиком
  // одной JSON-строкой, подпись проверяется по токену бота (validateTelegramLoginWidget).
  Credentials({
    id: "telegram-widget",
    name: "Telegram",
    credentials: {
      widgetData: { label: "widgetData", type: "text" },
      ref: { label: "ref", type: "text" },
    },
    async authorize(credentials) {
      if (!isDatabaseConfigured()) return null;

      const raw = typeof credentials?.widgetData === "string" ? credentials.widgetData : undefined;
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!raw || !botToken) return null;

      let payload: Record<string, string> | null;
      try {
        payload = toStringRecord(JSON.parse(raw));
      } catch {
        return null;
      }
      if (!payload) return null;

      const result = validateTelegramLoginWidget(payload, botToken);
      if (!result.valid || !result.user) return null;

      const { user, created } = await upsertTelegramUser(result.user);
      if (created) await attachReferrer(user.id, typeof credentials?.ref === "string" ? credentials.ref : undefined).catch(() => false);
      return { id: user.id, name: user.name, email: user.email, image: user.image };
    },
  }),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Провайдер Credentials требует JWT-сессий (Auth.js не поддерживает его вместе с сессиями в базе).
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      // Сессия перестаёт действовать, если пользователь удалён, его нет в этой базе (например, после
      // переезда на другую базу) или поколение сессий сменилось (сброс пароля, «выйти на всех
      // устройствах»), даже если cookie с подписанным токеном ещё действует: null сбрасывает сессию.
      if (!user && typeof token.userId === "string" && isDatabaseConfigured()) {
        try {
          if (!isSessionStillValid(token.sessionVersion, await getSessionUserState(token.userId))) return null;
        } catch {
          /* база недоступна: оставляем сессию, остальные проверки всё равно обратятся к базе */
        }
      }
      if (user?.id) {
        token.userId = user.id;
        try {
          token.sessionVersion = (await getSessionUserState(user.id))?.sessionVersion ?? 0;
        } catch {
          token.sessionVersion = 0;
        }
        try {
          token.planTier = await getPlanTier(user.id);
        } catch {
          token.planTier = "free";
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.userId as string) ?? "";
        // Тариф берём из базы при каждом обращении, а не из JWT: после оплаты он меняется сразу, а по
        // окончании срока Premium перестаёт действовать без повторного входа. JWT нужен лишь как запасной
        // вариант, если база недоступна.
        let planTier = (token.planTier as "free" | "premium") ?? "free";
        if (session.user.id) {
          try {
            planTier = await getPlanTier(session.user.id);
          } catch {
            /* оставляем значение из токена */
          }
        }
        session.user.planTier = planTier;
        // Признак нужен только чтобы показать ссылку на админ-панель; сама панель и её API при каждом
        // обращении проверяют права на сервере заново (lib/admin-guard.ts).
        let isAdmin = false;
        if (session.user.id && hasConfiguredAdmins()) {
          try {
            const candidate = await getAdminCandidate(session.user.id);
            isAdmin = candidate !== null && isAdminAccount(candidate);
          } catch {
            /* без базы администратором не считаем */
          }
        }
        session.user.isAdmin = isAdmin;
      }
      return session;
    },
  },
});
