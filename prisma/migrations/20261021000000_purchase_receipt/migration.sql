-- Чеки самозанятого: дата оплаты, ссылка на чек в «Мой налог», кто её внёс и когда чек отправлен покупателю.
ALTER TABLE "NatalChartPurchase" ADD COLUMN "paidAt" TIMESTAMP(3);
ALTER TABLE "NatalChartPurchase" ADD COLUMN "receiptUrl" TEXT;
ALTER TABLE "NatalChartPurchase" ADD COLUMN "receiptAttachedBy" TEXT;
ALTER TABLE "NatalChartPurchase" ADD COLUMN "receiptSentAt" TIMESTAMP(3);

-- Оплаченные покупки без выданного чека.
CREATE INDEX "NatalChartPurchase_status_receiptSentAt_idx" ON "NatalChartPurchase"("status", "receiptSentAt");
