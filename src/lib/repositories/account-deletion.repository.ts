import { prisma } from "@/lib/db";

/**
 * Удаляет личные данные пользователя по его требованию (отзыв согласия по 152-ФЗ, ст. 9 и 14).
 *
 * Стираются: расклады (вместе с картами и толкованиями), избранное, сохранённые расчёты нумерологии,
 * астрологии и натальных карт, привязки входа, подписка (и состояние подписок Звёздами — их автопродление
 * отключает маршрут удаления до этого), профиль Telegram, имя, фото, дата рождения.
 * Сохраняются записи о платежах (`Purchase`) и журнал действий администратора: платёжные документы
 * закон требует хранить, поэтому строка пользователя остаётся пустой оболочкой с меткой `deletedAt`.
 * Из неё убран Telegram ID, поэтому повторный вход создаст новый, пустой аккаунт.
 */
export async function deleteAccountData(userId: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId }, select: { deletedAt: true } });
    if (!user || user.deletedAt) return false;

    await tx.reading.deleteMany({ where: { userId } });
    await tx.favorite.deleteMany({ where: { userId } });
    await tx.numerologyReading.deleteMany({ where: { userId } });
    await tx.astrologyReading.deleteMany({ where: { userId } });
    await tx.natalChartReading.deleteMany({ where: { userId } });
    await tx.subscription.deleteMany({ where: { userId } });
    await tx.starSubscription.deleteMany({ where: { userId } });
    await tx.account.deleteMany({ where: { userId } });
    await tx.session.deleteMany({ where: { userId } });

    await tx.user.update({
      where: { id: userId },
      data: {
        name: null,
        email: null,
        emailVerified: null,
        image: null,
        passwordHash: null,
        telegramId: null,
        telegramUsername: null,
        telegramPhotoUrl: null,
        birthDate: null,
        natalChartCredits: 0,
        referralCode: null,
        deletedAt: new Date(),
      },
    });
    return true;
  });
}

/**
 * Нужно ли считать сессию недействительной: пользователь удалён или его вовсе нет в базе (например,
 * после переезда на другую базу cookie старой сессии остаётся у посетителя).
 */
export async function isUserGone(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { deletedAt: true } });
  return !user || user.deletedAt !== null;
}

/** Состояние пользователя для проверки сессии (см. lib/session-check.ts); null, если пользователя нет. */
export async function getSessionUserState(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, select: { deletedAt: true, sessionVersion: true } });
}

/** Завершает все выданные сессии пользователя: следующая проверка любой из них вернёт «не авторизован». */
export async function revokeAllSessions(userId: string): Promise<boolean> {
  const updated = await prisma.user.updateMany({ where: { id: userId, deletedAt: null }, data: { sessionVersion: { increment: 1 } } });
  return updated.count > 0;
}
