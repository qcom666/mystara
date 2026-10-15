-- Метка удаления аккаунта: личные данные стираются, строка остаётся владельцем платежей.
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);
