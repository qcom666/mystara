import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { ValidatedTelegramUser } from "@/lib/telegram/validate-init-data";
import { emailWhere, normalizeEmail } from "@/lib/email";

export type AddPasswordLoginResult = "ok" | "not_found" | "already_has_login" | "email_taken";

/**
 * Добавляет вход по e-mail и паролю аккаунту, созданному через Telegram (у него нет ни почты, ни пароля).
 * Так человек, пришедший из Mini App, сможет открывать сайт без кода подтверждения Telegram. Аккаунту,
 * у которого вход по почте уже есть, пароль этим способом не меняется.
 */
export async function addPasswordLogin(userId: string, email: string, passwordHash: string): Promise<AddPasswordLoginResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId }, select: { email: true, passwordHash: true, deletedAt: true } });
      if (!user || user.deletedAt) return "not_found";
      if (user.email || user.passwordHash) return "already_has_login";
      const taken = await tx.user.findFirst({ where: emailWhere(email), select: { id: true } });
      if (taken) return "email_taken";
      await tx.user.update({ where: { id: userId }, data: { email: normalizeEmail(email), passwordHash } });
      return "ok";
    });
  } catch (error) {
    // Две одновременные попытки занять один адрес: уникальный индекс пропустит только одну.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return "email_taken";
    throw error;
  }
}

export type LinkTelegramResult = "ok" | "not_found" | "already_linked" | "telegram_taken";

/**
 * Привязывает Telegram к аккаунту, зашедшему по e-mail. Если этот Telegram уже успел создать отдельный
 * аккаунт, он сливается только когда пуст (нет раскладов, сохранённых результатов, покупок и подписки):
 * пустую оболочку удаляем и занимаем её Telegram ID. Непустой аккаунт автоматически не трогаем, чтобы не
 * потерять чужие данные и платежи: такой случай разбирает администратор.
 */
export async function linkTelegramToUser(userId: string, telegram: ValidatedTelegramUser): Promise<LinkTelegramResult> {
  const telegramId = String(telegram.id);
  try {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId }, select: { telegramId: true, deletedAt: true } });
      if (!user || user.deletedAt) return "not_found";
      if (user.telegramId) return "already_linked";

      const other = await tx.user.findUnique({ where: { telegramId }, select: { id: true } });
      if (other) {
        const [readings, favorites, numerology, astrology, natalCharts, purchases, subscription] = await Promise.all([
          tx.reading.count({ where: { userId: other.id } }),
          tx.favorite.count({ where: { userId: other.id } }),
          tx.numerologyReading.count({ where: { userId: other.id } }),
          tx.astrologyReading.count({ where: { userId: other.id } }),
          tx.natalChartReading.count({ where: { userId: other.id } }),
          tx.purchase.count({ where: { userId: other.id } }),
          tx.subscription.count({ where: { userId: other.id } }),
        ]);
        if (readings + favorites + numerology + astrology + natalCharts + purchases + subscription > 0) return "telegram_taken";
        await tx.user.delete({ where: { id: other.id } });
      }

      await tx.user.update({
        where: { id: userId },
        data: { telegramId, telegramUsername: telegram.username ?? null, telegramPhotoUrl: telegram.photoUrl ?? null },
      });
      return "ok";
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return "telegram_taken";
    throw error;
  }
}
