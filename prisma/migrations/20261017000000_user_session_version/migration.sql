-- Поколение сессий: при его увеличении все выданные ранее сессии пользователя перестают действовать.
ALTER TABLE "User" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;
