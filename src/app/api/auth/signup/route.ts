import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "@/lib/db";
import { recordEvent } from "@/lib/analytics-store";
import { EMAIL_VERIFICATION_TTL_MS } from "@/lib/auth-tokens";
import { PRIVACY_POLICY_VERSION } from "@/lib/legal/operator";
import { logError } from "@/lib/logger";
import { getMailer } from "@/lib/mail/mailer";
import { emailVerificationMessage } from "@/lib/mail/templates";
import { enforceRateLimit } from "@/lib/rate-limit";
import { issueToken } from "@/lib/repositories/auth-token.repository";
import { getSiteUrl } from "@/lib/site-url";
import { signupSchema } from "@/lib/validation/reading.schema";

const BCRYPT_ROUNDS = 12;

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "signup", { limit: 10, windowSeconds: 3600 });
  if (limited) return limited;
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "db_not_configured", message: "Persistence isn't configured yet." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return NextResponse.json({ error: "email_taken", message: "An account with that email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      privacyConsentAt: new Date(),
      privacyPolicyVersion: PRIVACY_POLICY_VERSION,
    },
  });

  await recordEvent({ name: "signup_completed" }, { shell: "web" });

  // Письмо для подтверждения адреса, если почта настроена. Подтверждение ничего не блокирует, поэтому
  // сбой отправки регистрацию не отменяет: пользователь сможет запросить письмо из личного кабинета.
  const mailer = getMailer();
  if (mailer && user.email) {
    try {
      const token = await issueToken("verify", `${user.id}:${user.email}`, EMAIL_VERIFICATION_TTL_MS);
      await mailer.send(emailVerificationMessage(user.email, `${getSiteUrl(request)}/verify-email?token=${encodeURIComponent(token)}`));
    } catch (error) {
      logError("signup-verification-mail", error);
    }
  }

  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } }, { status: 201 });
}
