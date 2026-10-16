import { NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseConfigured, prisma } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { consumeToken } from "@/lib/repositories/auth-token.repository";

const bodySchema = z.object({ token: z.string().min(20).max(200) });

/** Подтверждает адрес почты по токену из письма. Токен привязан к адресу: если адрес сменился, он не сработает. */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "verify-email", { limit: 20, windowSeconds: 3600 });
  if (limited) return limited;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "db_not_configured" }, { status: 503 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const subject = await consumeToken("verify", parsed.data.token);
  const separator = subject?.indexOf(":") ?? -1;
  if (!subject || separator < 1) return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  const userId = subject.slice(0, separator);
  const email = subject.slice(separator + 1);

  const updated = await prisma.user.updateMany({ where: { id: userId, email, deletedAt: null }, data: { emailVerified: new Date() } });
  if (updated.count === 0) return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
