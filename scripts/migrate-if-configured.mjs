// Vercel build step: apply pending Prisma migrations, but only where a database
// exists. Without DATABASE_URL (previews, local builds, the pre-database
// production) it is a no-op, so the build never fails for lack of a DB.
import { spawnSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.log("[migrate] DATABASE_URL is not set — skipping migrations");
  process.exit(0);
}

console.log("[migrate] applying pending migrations");
const result = spawnSync("npx", ["prisma", "migrate", "deploy"], { stdio: "inherit", shell: true });
process.exit(result.status ?? 1);
