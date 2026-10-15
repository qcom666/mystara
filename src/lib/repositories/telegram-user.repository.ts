import { prisma } from "@/lib/db";
import type { ValidatedTelegramUser } from "@/lib/telegram/validate-init-data";

/**
 * Находит пользователя по Telegram ID или создаёт его. Общая точка для двух способов входа: из
 * мини-приложения (initData) и с сайта (виджет «Войти через Telegram»). Данные уже прошли проверку
 * подписи, поэтому здесь им можно доверять.
 */
export async function upsertTelegramUser(user: ValidatedTelegramUser) {
  const telegramId = String(user.id);
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "Telegram User";

  return prisma.user.upsert({
    where: { telegramId },
    create: {
      telegramId,
      telegramUsername: user.username ?? null,
      telegramPhotoUrl: user.photoUrl ?? null,
      name: displayName,
      image: user.photoUrl ?? null,
      language: user.languageCode ?? "en",
    },
    update: {
      telegramUsername: user.username ?? null,
      telegramPhotoUrl: user.photoUrl ?? null,
      name: displayName,
    },
  });
}
