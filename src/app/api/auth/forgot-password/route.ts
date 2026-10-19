import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { PASSWORD_RESET_TTL_MS } from "@/lib/auth-tokens";
import { isDatabaseConfigured, prisma } from "@/lib/db";
import { logError } from "@/lib/logger";
import { getMailer } from "@/lib/mail/mailer";
import { passwordResetMessage } from "@/lib/mail/templates";
import { enforceKeyedRateLimit, enforceRateLimit } from "@/lib/rate-limit";
import { issueToken } from "@/lib/repositories/auth-token.repository";
import { getSiteUrl } from "@/lib/site-url";
import { emailField, emailWhere } from "@/lib/email";

const bodySchema = z.object({ email: emailField });

/**
 * Запрос письма для восстановления пароля. На любой существующий и несуществующий адрес ответ одинаковый
 * (`ok`), чтобы нельзя было выяснить, кто зарегистрирован. Если почта не настроена, честно отвечаем 503.
 */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "forgot-password", { limit: 5, windowSeconds: 3600 });
  if (limited) return limited;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "db_not_configured" }, { status: 503 });

  const mailer = getMailer();
  if (!mailer) return NextResponse.json({ error: "mail_not_configured" }, { status: 503 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  const { email } = parsed.data;

  // Не больше трёх писем в час на один адрес, кто бы ни просил: защита почтового ящика от заваливания.
  const emailKey = createHash("sha256").update(email.toLowerCase()).digest("hex").slice(0, 32);
  const perEmail = enforceKeyedRateLimit("forgot-password-email", emailKey, { limit: 3, windowSeconds: 3600 });
  if (perEmail) return perEmail;

  try {
    const user = await prisma.user.findFirst({ where: emailWhere(email), orderBy: { createdAt: "asc" }, select: { id: true, passwordHash: true, deletedAt: true } });
    if (user?.passwordHash && !user.deletedAt) {
      const token = await issueToken("reset", user.id, PASSWORD_RESET_TTL_MS);
      await mailer.send(passwordResetMessage(email, `${getSiteUrl(request)}/reset-password?token=${encodeURIComponent(token)}`));
    }
  } catch (error) {
    // Ошибка отправки не должна выдавать, существует ли адрес: пишем в журнал и отвечаем как обычно.
    logError("forgot-password", error);
  }
  return NextResponse.json({ ok: true });
}
