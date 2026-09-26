import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { isDatabaseConfigured, prisma } from "./db";
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
      // Fail closed (no session) rather than throwing a raw connection error
      // when the app hasn't been given a DATABASE_URL yet.
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
  // Telegram Mini App auth: the client sends the raw `initData` string
  // Telegram itself signed (window.Telegram.WebApp.initData) — never trust
  // it without the HMAC check in validateTelegramInitData. There's no
  // password here; the signature IS the credential.
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

// Only registered when configured, so the app never crashes at import time
// in environments (like this one) that haven't set up Google OAuth yet.
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
  // Credentials requires JWT sessions (Auth.js does not support the
  // Credentials provider with database sessions).
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.userId = user.id;
        try {
          const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
          token.planTier = subscription?.tier === "PREMIUM" ? "premium" : "free";
        } catch {
          token.planTier = "free";
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.userId as string) ?? "";
        session.user.planTier = (token.planTier as "free" | "premium") ?? "free";
      }
      return session;
    },
  },
});
