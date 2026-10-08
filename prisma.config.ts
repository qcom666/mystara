import { defineConfig } from "prisma/config";

// В Prisma 7 адрес подключения вынесен из schema.prisma. Этот конфиг используют команды CLI
// (миграции, интроспекция); PrismaClient самого приложения настраивается отдельно через адаптер
// драйвера в src/lib/db.ts. process.env читаем напрямую (а не через `env()` из Prisma), чтобы
// `prisma generate` работал и без заданного DATABASE_URL.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
