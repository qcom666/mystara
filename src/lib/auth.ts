import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { isDatabaseConfigured, prisma } from "./db";
import { hasConfiguredAdmins, isAdminAccount } from "./admin";
import { getAdminCandidate } from "./repositories/account.repository";
import { isUserGone } from "./repositories/account-deletion.repository";
import { getPlanTier } from "./repositories/subscription.repository";
import { upsertTelegramUser } from "./repositories/telegram-user.repository";
import { validateTelegramInitData } from "./telegram/validate-init-data";
import { validateTelegramLoginWidget } from "./telegram/validate-login-widget";

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

// Единственный способ входа: через Telegram. Пароля нет, учётными данными служит подпись Telegram.
const providers: NextAuthConfig["providers"] = [
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

      const user = await upsertTelegramUser(result.user);
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

      const user = await upsertTelegramUser(result.user);
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
      // Удалённый пользователь (или пользователь, которого нет в этой базе, например после переезда на
      // другую базу) больше не авторизован, даже если cookie с подписанным токеном ещё действует:
      // null из этого колбэка сбрасывает сессию.
      if (!user && typeof token.userId === "string" && isDatabaseConfigured()) {
        try {
          if (await isUserGone(token.userId)) return null;
        } catch {
          /* база недоступна: оставляем сессию, остальные проверки всё равно обратятся к базе */
        }
      }
      if (user?.id) {
        token.userId = user.id;
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
