import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured, prisma } from "@/lib/db";
import { PRIVACY_POLICY_VERSION } from "@/lib/legal/operator";
import { privacyConsentSchema } from "@/lib/validation/reading.schema";

/**
 * Stores a signed-in user's consent to personal-data processing. Sign-up records
 * it itself; this covers the other doors (Google, Telegram) where the account is
 * created by the sign-in provider and the consent was given on this device just before.
 * Idempotent per policy version, so calling it on every visit costs one read.
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
  // Only the current policy version can be consented to — a stale client can't record an old one.
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
