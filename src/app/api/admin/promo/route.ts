import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/admin-guard";
import { createPromoCode } from "@/lib/repositories/promo.repository";

const bodySchema = z.object({
  code: z.string().trim().min(3).max(32),
  kind: z.enum(["natal_credits", "premium_days"]),
  amount: z.number().int().min(1).max(365),
  maxRedemptions: z.number().int().min(1).max(100_000).nullable(),
  expiresAt: z.iso.date().nullable(),
  note: z.string().trim().max(200).nullable(),
});

/** Создание промокода. Не-администраторам отвечает 404, как и остальные админ-маршруты. */
export async function POST(request: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const { expiresAt, ...rest } = parsed.data;
  const result = await createPromoCode({
    ...rest,
    // Действует до конца указанного дня по Москве.
    expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59+03:00`) : null,
    note: rest.note || null,
    createdBy: admin.id,
  });
  if (result !== "ok") return NextResponse.json({ error: result }, { status: 409 });
  return NextResponse.json({ ok: true });
}
