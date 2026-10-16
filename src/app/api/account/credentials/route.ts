import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { EMAIL_VERIFICATION_TTL_MS } from "@/lib/auth-tokens";
import { logError } from "@/lib/logger";
import { getMailer } from "@/lib/mail/mailer";
import { emailVerificationMessage } from "@/lib/mail/templates";
import { enforceRateLimit } from "@/lib/rate-limit";
import { addPasswordLogin } from "@/lib/repositories/account-link.repository";
import { issueToken } from "@/lib/repositories/auth-token.repository";
import { getSiteUrl } from "@/lib/site-url";

const BCRYPT_ROUNDS = 12;

const credentialsSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72),
});

/**
 * Добавляет вход по e-mail и паролю аккаунту, созданному через Telegram. Согласие на обработку данных уже
 * дано при создании аккаунта, поэтому повторно не запрашивается.
 */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "account-credentials", { limit: 10, windowSeconds: 3600 });
  if (limited) return limited;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "db_not_configured" }, { status: 503 });

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = credentialsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const passwordHash = await bcrypt.hash(parsed.data.password, BCRYPT_ROUNDS);
  const result = await addPasswordLogin(session.user.id, parsed.data.email, passwordHash);
  if (result === "ok") {
    // Письмо для подтверждения адреса, если почта настроена; сбой отправки сохранение не отменяет.
    const mailer = getMailer();
    if (mailer) {
      try {
        const token = await issueToken("verify", `${session.user.id}:${parsed.data.email}`, EMAIL_VERIFICATION_TTL_MS);
        await mailer.send(emailVerificationMessage(parsed.data.email, `${getSiteUrl(request)}/verify-email?token=${encodeURIComponent(token)}`));
      } catch (error) {
        logError("credentials-verification-mail", error);
      }
    }
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: result }, { status: result === "not_found" ? 404 : 409 });
}
