import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Prisma 7 requires a driver adapter to be passed explicitly — there is no
 * zero-argument `new PrismaClient()` anymore (see PROJECT_ARCHITECTURE.md
 * §10 / TODO.md Phase 4). The adapter is constructed unconditionally so the
 * app can boot without DATABASE_URL: `pg.Pool` connects lazily, so a
 * placeholder connection string is harmless as long as no query ever runs —
 * which `isDatabaseConfigured()` guarantees by gating every DB-touching
 * route below.
 */
function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL ?? "postgresql://localhost:5432/not-configured";
  // Serverless: every function instance opens its own pool, so many instances × a big pool
  // quickly exhausts the database's connection limit. Keep each pool tiny and let idle
  // connections go quickly (override with DATABASE_POOL_MAX if the plan allows more).
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
