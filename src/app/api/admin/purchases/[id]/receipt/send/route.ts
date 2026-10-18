import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/admin-guard";
import { sendReceiptToBuyer } from "@/lib/payments/receipt-delivery";
import { enforceRateLimit } from "@/lib/rate-limit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const STATUS: Record<string, number> = { not_found: 404, not_paid: 409, no_receipt: 409, no_channel: 409, conflict: 409, delivery_failed: 502 };

/**
 * Отправка чека покупателю ботом и/или письмом. С `{ "manual": true }` только отмечает чек выданным: оператор
 * передал его сам. Не-администраторам отвечает 404.
 */
export async function POST(request: Request, { params }: RouteParams) {
  const limited = enforceRateLimit(request, "admin-receipt-send", { limit: 300, windowSeconds: 3600 });
  if (limited) return limited;

  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = (await request.json().catch(() => null)) as { manual?: unknown } | null;
  const { id } = await params;
  const outcome = await sendReceiptToBuyer({ purchaseId: id, adminId: admin.id, manual: body?.manual === true });
  if (!outcome.ok) return NextResponse.json({ error: outcome.error }, { status: STATUS[outcome.error] ?? 409 });
  return NextResponse.json({ ok: true, channels: outcome.channels });
}
