import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/admin-guard";
import { adjustCredits } from "@/lib/repositories/admin.repository";

const bodySchema = z.object({
  delta: z.number().int().min(-1000).max(1000).refine((value) => value !== 0, "delta must not be zero"),
  reason: z.string().trim().min(3).max(200),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Ручная корректировка кредитов пользователя. Для не-администраторов маршрут притворяется несуществующим
 * (404), чтобы не подтверждать, что админ-панель есть.
 */
export async function POST(request: Request, { params }: RouteParams) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input", issues: parsed.error.flatten() }, { status: 400 });

  const { id } = await params;
  const result = await adjustCredits({ adminId: admin.id, userId: id, delta: parsed.data.delta, reason: parsed.data.reason });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.error === "not_found" ? 404 : 409 });
  }
  return NextResponse.json(result.value);
}
