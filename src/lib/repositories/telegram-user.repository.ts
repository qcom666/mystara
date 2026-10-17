import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { ValidatedTelegramUser } from "@/lib/telegram/validate-init-data";

/**
 * Находит пользователя по Telegram ID или создаёт его. Общая точка для двух способов входа: из
 * мини-приложения (initData) и с сайта (виджет «Войти через Telegram»). Данные уже прошли проверку
 * подписи, поэтому здесь им можно доверять. `created` нужен, чтобы приглашение привязывалось только к
 * новому аккаунту.
 */
export async function upsertTelegramUser(user: ValidatedTelegramUser) {
  const telegramId = String(user.id);
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "Telegram User";
  const profile = { telegramUsername: user.username ?? null, telegramPhotoUrl: user.photoUrl ?? null, name: displayName };

  const existing = await prisma.user.findUnique({ where: { telegramId }, select: { id: true } });
  if (existing) {
    return { user: await prisma.user.update({ where: { id: existing.id }, data: profile }), created: false };
  }
  try {
    const created = await prisma.user.create({
      data: { telegramId, ...profile, image: user.photoUrl ?? null, language: user.languageCode ?? "en" },
    });
    return { user: created, created: true };
  } catch (error) {
    // Два одновременных первых входа: второй находит уже созданный аккаунт.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { user: await prisma.user.update({ where: { telegramId }, data: profile }), created: false };
    }
    throw error;
  }
}

/**
 * Язык клиента Telegram из сообщений боту: по нему бот пишет пользователю (уведомления об оплате,
 * напоминания). При входе через виджет на сайте язык не передаётся, поэтому он уточняется здесь.
 */
export async function rememberTelegramLanguage(telegramId: string, languageCode: string): Promise<void> {
  const language = languageCode.toLowerCase().startsWith("ru") ? "ru" : "en";
  await prisma.user.updateMany({ where: { telegramId, deletedAt: null, NOT: { language } }, data: { language } });
}
