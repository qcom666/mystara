import { prisma } from "@/lib/db";

/** Подписывает чат на «Карту дня» (или включает обратно), запоминая язык ответов. */
export async function subscribeDailyCard(chatId: string, language: "ru" | "en") {
  await prisma.botSubscriber.upsert({
    where: { chatId },
    create: { chatId, language },
    update: { dailyCard: true, language, blockedAt: null },
  });
}

export async function unsubscribeDailyCard(chatId: string) {
  await prisma.botSubscriber.updateMany({ where: { chatId }, data: { dailyCard: false } });
}

/** Кому сегодня ещё не отправлена карта: подписанные и не заблокировавшие бота. */
export async function listDailyCardRecipients(day: string, take: number) {
  return prisma.botSubscriber.findMany({
    where: { dailyCard: true, blockedAt: null, OR: [{ lastDailySentOn: null }, { lastDailySentOn: { not: day } }] },
    orderBy: { subscribedAt: "asc" },
    take,
    select: { chatId: true, language: true },
  });
}

export async function markDailyCardSent(chatId: string, day: string) {
  await prisma.botSubscriber.update({ where: { chatId }, data: { lastDailySentOn: day } });
}

/** Пользователь заблокировал бота или удалил чат: больше не пытаемся писать. */
export async function markSubscriberBlocked(chatId: string) {
  await prisma.botSubscriber.update({ where: { chatId }, data: { blockedAt: new Date() } });
}
