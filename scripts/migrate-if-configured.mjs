// Vercel build step: apply pending Prisma migrations, but only where a database
// exists. Without DATABASE_URL (previews, local builds, the pre-database
// production) it is a no-op, so the build never fails for lack of a DB.
//
// Migrations must go over a DIRECT connection: through a pooler (PgBouncer, as in
// Neon's pooled DATABASE_URL) Prisma's advisory lock can hang. When the provider
// also supplies DATABASE_URL_UNPOOLED we use that for the migration only; the app
// itself keeps using the pooled DATABASE_URL at runtime.
import { spawnSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.log("[migrate] DATABASE_URL is not set — skipping migrations");
  process.exit(0);
}

const direct = process.env.DATABASE_URL_UNPOOLED;
console.log(`[migrate] applying pending migrations (${direct ? "direct connection" : "DATABASE_URL"})`);
const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, DATABASE_URL: direct || process.env.DATABASE_URL },
});
process.exit(result.status ?? 1);
