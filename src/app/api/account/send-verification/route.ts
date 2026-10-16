import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { EMAIL_VERIFICATION_TTL_MS } from "@/lib/auth-tokens";
import { isDatabaseConfigured, prisma } from "@/lib/db";
import { getMailer } from "@/lib/mail/mailer";
import { emailVerificationMessage } from "@/lib/mail/templates";
import { enforceRateLimit } from "@/lib/rate-limit";
import { issueToken } from "@/lib/repositories/auth-token.repository";
import { getSiteUrl } from "@/lib/site-url";

/** Отправляет письмо для подтверждения адреса почты текущему пользователю. */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "send-verification", { limit: 5, windowSeconds: 3600 });
  if (limited) return limited;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "db_not_configured" }, { status: 503 });

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const mailer = getMailer();
  if (!mailer) return NextResponse.json({ error: "mail_not_configured" }, { status: 503 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, email: true, emailVerified: true, deletedAt: true } });
  if (!user || user.deletedAt || !user.email) return NextResponse.json({ error: "no_email" }, { status: 409 });
  if (user.emailVerified) return NextResponse.json({ error: "already_verified" }, { status: 409 });

  const token = await issueToken("verify", `${user.id}:${user.email}`, EMAIL_VERIFICATION_TTL_MS);
  await mailer.send(emailVerificationMessage(user.email, `${getSiteUrl(request)}/verify-email?token=${encodeURIComponent(token)}`));
  return NextResponse.json({ ok: true });
}
