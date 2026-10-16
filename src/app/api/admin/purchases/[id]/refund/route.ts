import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/admin-guard";
import { logError } from "@/lib/logger";
import { refundPurchaseByAdmin } from "@/lib/payments/refund";
import { enforceRateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({ reason: z.string().trim().min(3).max(200) });

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Возврат оплаченной покупки. Не-администраторам отвечает 404, как и остальные админ-маршруты. */
export async function POST(request: Request, { params }: RouteParams) {
  const limited = enforceRateLimit(request, "admin-refund", { limit: 20, windowSeconds: 3600 });
  if (limited) return limited;

  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const { id } = await params;
  const outcome = await refundPurchaseByAdmin({ purchaseId: id, adminId: admin.id, reason: parsed.data.reason });
  if (!outcome.ok) {
    if (outcome.error === "provider_failed") logError("admin-refund", "provider refused the refund", { purchaseId: id });
    const status = outcome.error === "not_found" ? 404 : outcome.error === "provider_failed" ? 502 : 409;
    return NextResponse.json({ error: outcome.error }, { status });
  }
  return NextResponse.json({ ok: true, status: outcome.status });
}
