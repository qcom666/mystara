import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseConfigured, prisma } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { consumeToken } from "@/lib/repositories/auth-token.repository";

const BCRYPT_ROUNDS = 12;

const bodySchema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(8).max(72),
});

/**
 * Задаёт новый пароль по токену из письма. Токен одноразовый: он гасится при первой же проверке. Раз
 * человек получил письмо, адрес заодно считается подтверждённым. Все ранее выданные сессии при этом
 * завершаются (поколение сессий увеличивается), поэтому тот, кто знал старый пароль, теряет доступ.
 */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "reset-password", { limit: 10, windowSeconds: 3600 });
  if (limited) return limited;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "db_not_configured" }, { status: 503 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const userId = await consumeToken("reset", parsed.data.token);
  if (!userId) return NextResponse.json({ error: "invalid_token" }, { status: 400 });

  const passwordHash = await bcrypt.hash(parsed.data.password, BCRYPT_ROUNDS);
  const updated = await prisma.user.updateMany({
    where: { id: userId, deletedAt: null, passwordHash: { not: null } },
    data: { passwordHash, emailVerified: new Date(), sessionVersion: { increment: 1 } },
  });
  if (updated.count === 0) return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
