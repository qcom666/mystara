import type { NextRequest } from "next/server";
import { handlers } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";

export const { GET } = handlers;

// Все попытки входа идут через POST: ограничиваем их, чтобы нельзя было перебирать подписи без остановки.
export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, "auth", { limit: 20, windowSeconds: 60 });
  if (limited) return limited;
  return handlers.POST(request);
}
