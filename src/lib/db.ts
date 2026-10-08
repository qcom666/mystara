import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Prisma 7 требует явно передавать адаптер драйвера: конструктора `new PrismaClient()` без аргументов
 * больше нет. Адаптер создаётся всегда, чтобы приложение запускалось и без DATABASE_URL: `pg.Pool`
 * подключается лениво, поэтому строка-заглушка безвредна, пока не выполняется ни один запрос, а это
 * гарантирует `isDatabaseConfigured()`, закрывающая все маршруты, которые обращаются к базе.
 */
function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL ?? "postgresql://localhost:5432/not-configured";
  // Serverless: каждый экземпляр функции открывает собственный пул, поэтому много экземпляров × большой
  // пул быстро исчерпывают лимит соединений базы. Держим пул маленьким и быстро отпускаем простаивающие
  // соединения (можно переопределить через DATABASE_POOL_MAX, если тариф позволяет).
  const adapter = new PrismaPg({
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX) || 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
