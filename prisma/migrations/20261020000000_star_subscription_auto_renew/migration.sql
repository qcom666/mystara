-- Автопродление Premium подпиской Звёздами: отметка покупки, открывающей подписку, и ссылка повторного списания на неё.
ALTER TABLE "NatalChartPurchase" ADD COLUMN "autoRenew" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "renewalOfId" TEXT;

-- Состояние подписки Звёздами: первая оплата, кому принадлежит в Telegram, продлевается ли и до какого числа оплачена.
CREATE TABLE "StarSubscription" (
    "purchaseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chargeId" TEXT NOT NULL,
    "telegramUserId" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'active',
    "canceledBy" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StarSubscription_pkey" PRIMARY KEY ("purchaseId")
);

CREATE UNIQUE INDEX "StarSubscription_chargeId_key" ON "StarSubscription"("chargeId");
CREATE INDEX "StarSubscription_userId_state_idx" ON "StarSubscription"("userId", "state");
CREATE INDEX "StarSubscription_expiresAt_idx" ON "StarSubscription"("expiresAt");
CREATE INDEX "NatalChartPurchase_renewalOfId_idx" ON "NatalChartPurchase"("renewalOfId");

ALTER TABLE "NatalChartPurchase" ADD CONSTRAINT "NatalChartPurchase_renewalOfId_fkey" FOREIGN KEY ("renewalOfId") REFERENCES "NatalChartPurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StarSubscription" ADD CONSTRAINT "StarSubscription_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "NatalChartPurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StarSubscription" ADD CONSTRAINT "StarSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
