import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/admin-guard";
import { parseReceiptUrl } from "@/lib/payments/receipts";
import { enforceRateLimit } from "@/lib/rate-limit";
import { attachReceipt } from "@/lib/repositories/receipt.repository";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Ссылка на чек «Мой налог» для оплаченной покупки. Принимается только https://lknpd.nalog.ru/…
 * Не-администраторам отвечает 404, как и остальные админ-маршруты.
 */
export async function PUT(request: Request, { params }: RouteParams) {
  const limited = enforceRateLimit(request, "admin-receipt", { limit: 300, windowSeconds: 3600 });
  if (limited) return limited;

  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = (await request.json().catch(() => null)) as { url?: unknown } | null;
  const receiptUrl = parseReceiptUrl(body?.url);
  if (!receiptUrl) return NextResponse.json({ error: "invalid_url" }, { status: 400 });

  const { id } = await params;
  const result = await attachReceipt({ purchaseId: id, adminId: admin.id, receiptUrl });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.error === "not_found" ? 404 : 409 });
  return NextResponse.json({ ok: true, changed: result.changed, receiptUrl });
}
