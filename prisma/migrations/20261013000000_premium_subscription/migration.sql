-- AlterTable
ALTER TABLE "NatalChartPurchase" ADD COLUMN     "product" TEXT NOT NULL DEFAULT 'natal_pack';

-- AlterTable
ALTER TABLE "NatalChartReading" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'credit';
