import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured, prisma } from "@/lib/db";
import { PRIVACY_POLICY_VERSION } from "@/lib/legal/operator";
import { privacyConsentSchema } from "@/lib/validation/reading.schema";
import { enforceRateLimit } from "@/lib/rate-limit";

/**
 * Сохраняет согласие вошедшего пользователя на обработку персональных данных. Аккаунт создаётся при
 * входе через Telegram, а согласие дано на этом устройстве чуть раньше, поэтому оно записывается
 * в базу уже после входа этим маршрутом.
 * Идемпотентен для каждой версии политики, поэтому вызов при каждом визите стоит одного чтения.
 */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "privacy-consent", { limit: 30, windowSeconds: 60 });
  if (limited) return limited;
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "db_not_configured" }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = privacyConsentSchema.safeParse(body);
  // Согласие можно дать только на текущую версию политики: устаревший клиент не запишет старую.
  if (!parsed.success || parsed.data.version !== PRIVACY_POLICY_VERSION) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { privacyPolicyVersion: true },
  });
  if (user && user.privacyPolicyVersion !== PRIVACY_POLICY_VERSION) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { privacyConsentAt: new Date(), privacyPolicyVersion: PRIVACY_POLICY_VERSION },
    });
  }

  return NextResponse.json({ ok: true });
}
