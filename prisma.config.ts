import { defineConfig } from "prisma/config";

// Prisma 7 moved the connection URL out of schema.prisma. This config is
// used by the CLI (migrate/introspect) — the app's runtime PrismaClient is
// configured separately via a driver adapter in src/lib/db.ts. Reading
// process.env directly (not Prisma's `env()` helper) so `prisma generate`
// keeps working even when DATABASE_URL isn't set yet (see TODO.md Phase 4).
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
