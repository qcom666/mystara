-- Обезличенная статистика использования для воронки в админ-панели.
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "shell" TEXT NOT NULL,
    "locale" TEXT,
    "props" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AnalyticsEvent_day_name_idx" ON "AnalyticsEvent"("day", "name");
