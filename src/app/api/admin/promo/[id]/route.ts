import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/admin-guard";
import { setPromoCodeActive } from "@/lib/repositories/promo.repository";

const bodySchema = z.object({ active: z.boolean() });

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Включение и отключение промокода. Не-администраторам отвечает 404. */
export async function POST(request: Request, { params }: RouteParams) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const { id } = await params;
  const updated = await setPromoCodeActive(id, parsed.data.active);
  return updated ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "not_found" }, { status: 404 });
}
