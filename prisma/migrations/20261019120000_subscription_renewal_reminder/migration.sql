-- Напоминание о продлении Premium: конец периода, о котором уже напомнили.
ALTER TABLE "Subscription" ADD COLUMN "renewalReminderFor" TIMESTAMP(3);

-- Поиск подписок, которые скоро заканчиваются.
CREATE INDEX "Subscription_status_currentPeriodEnd_idx" ON "Subscription"("status", "currentPeriodEnd");
