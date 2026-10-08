import { defineConfig } from "prisma/config";

// Используется только в db/mystara/studio.ps1 для просмотра базы `mystara` в Prisma Studio.
// Схема рядом с этим файлом служебная: Studio читает структуру прямо из базы.
// Это не схема приложения (она лежит в prisma/schema.prisma).
export default defineConfig({
  schema: "schema.prisma",
  datasource: { url: process.env.DATABASE_URL },
});
