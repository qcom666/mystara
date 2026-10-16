import { NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";

// Всегда свежий ответ: монитор доступности должен видеть текущее состояние, а не кэш.
export const dynamic = "force-dynamic";

const DATABASE_TIMEOUT_MS = 3000;

/**
 * Состояние сервиса для мониторинга доступности (UptimeRobot, Better Stack и т. п.): 200, если сайт и база
 * отвечают, 503, если база настроена, но не отвечает. Секретов и данных пользователей в ответе нет.
 */
export async function GET(request: Request) {
  const limited = enforceRateLimit(request, "health", { limit: 60, windowSeconds: 60 });
  if (limited) return limited;

  const version = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null;
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ status: "ok", database: "not_configured", version });
  }

  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), DATABASE_TIMEOUT_MS)),
    ]);
    return NextResponse.json({ status: "ok", database: "ok", version });
  } catch {
    return NextResponse.json({ status: "degraded", database: "error", version }, { status: 503 });
  }
}
