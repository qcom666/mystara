import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/admin-guard";
import { endPremiumByAdmin, extendPremiumByAdmin } from "@/lib/repositories/admin.repository";

const reason = z.string().trim().min(3).max(200);
const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("extend"), days: z.number().int().min(1).max(365), reason }),
  z.object({ action: z.literal("end"), reason }),
]);

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Ручное продление или досрочное прекращение Premium. Не-администраторам отвечает 404, как и остальные админ-маршруты. */
export async function POST(request: Request, { params }: RouteParams) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input", issues: parsed.error.flatten() }, { status: 400 });

  const { id } = await params;
  const result =
    parsed.data.action === "extend"
      ? await extendPremiumByAdmin({ adminId: admin.id, userId: id, days: parsed.data.days, reason: parsed.data.reason })
      : await endPremiumByAdmin({ adminId: admin.id, userId: id, reason: parsed.data.reason });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 404 });
  return NextResponse.json({ ok: true });
}
