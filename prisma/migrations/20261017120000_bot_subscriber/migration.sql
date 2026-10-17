-- Подписчики «Карты дня» в Telegram-боте.
CREATE TABLE "BotSubscriber" (
    "chatId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'ru',
    "dailyCard" BOOLEAN NOT NULL DEFAULT true,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastDailySentOn" TEXT,
    "blockedAt" TIMESTAMP(3),

    CONSTRAINT "BotSubscriber_pkey" PRIMARY KEY ("chatId")
);

CREATE INDEX "BotSubscriber_dailyCard_lastDailySentOn_idx" ON "BotSubscriber"("dailyCard", "lastDailySentOn");
