import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured, prisma } from "@/lib/db";
import { PRIVACY_POLICY_VERSION } from "@/lib/legal/operator";
import { privacyConsentSchema } from "@/lib/validation/reading.schema";

/**
 * Сохраняет согласие вошедшего пользователя на обработку персональных данных. При регистрации по e-mail
 * согласие записывается само; этот маршрут нужен для остальных способов входа (Google, Telegram), где
 * аккаунт создаёт провайдер входа, а согласие дано на этом устройстве чуть раньше.
 * Идемпотентен для каждой версии политики, поэтому вызов при каждом визите стоит одного чтения.
 */
export async function POST(request: Request) {
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
