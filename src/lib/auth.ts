import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { isDatabaseConfigured, prisma } from "./db";
import { hasConfiguredAdmins, isAdminAccount } from "./admin";
import { getAdminCandidate } from "./repositories/account.repository";
import { getPlanTier } from "./repositories/subscription.repository";
import { validateTelegramInitData } from "./telegram/validate-init-data";

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

      const email = typeof credentials?.email === "string" ? credentials.email : undefined;
      const password = typeof credentials?.password === "string" ? credentials.password : undefined;
      if (!email || !password) return null;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.passwordHash) return null;

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) return null;

      return { id: user.id, name: user.name, email: user.email, image: user.image };
    },
  }),
  // Вход из Telegram Mini App: клиент присылает исходную строку `initData`, подписанную самим Telegram
  // (window.Telegram.WebApp.initData); без проверки HMAC в validateTelegramInitData ей доверять нельзя.
  // Пароля здесь нет: учётными данными служит сама подпись.
  Credentials({
    id: "telegram",
    name: "Telegram",
    credentials: {
      initData: { label: "initData", type: "text" },
    },
    async authorize(credentials) {
      if (!isDatabaseConfigured()) return null;

      const initData = typeof credentials?.initData === "string" ? credentials.initData : undefined;
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!initData || !botToken) return null;

      const result = validateTelegramInitData(initData, botToken);
      if (!result.valid || !result.user) return null;

      const telegramId = String(result.user.id);
      const displayName =
        [result.user.firstName, result.user.lastName].filter(Boolean).join(" ") || result.user.username || "Telegram User";

      const user = await prisma.user.upsert({
        where: { telegramId },
        create: {
          telegramId,
          telegramUsername: result.user.username ?? null,
          telegramPhotoUrl: result.user.photoUrl ?? null,
          name: displayName,
          image: result.user.photoUrl ?? null,
          language: result.user.languageCode ?? "en",
        },
        update: {
          telegramUsername: result.user.username ?? null,
          telegramPhotoUrl: result.user.photoUrl ?? null,
          name: displayName,
        },
      });

      return { id: user.id, name: user.name, email: user.email, image: user.image };
    },
  }),
];

// Регистрируется только если настроен, чтобы приложение не падало при импорте в окружениях,
// где Google OAuth ещё не настроен.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Credentials требует JWT-сессий (Auth.js не поддерживает провайдер Credentials с сессиями в базе).
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    async jwt({ token, user }) {
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
