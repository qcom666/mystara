// Шаг сборки на Vercel: применяет ожидающие миграции Prisma, но только там, где есть база.
// Без DATABASE_URL (превью, локальные сборки, прод до подключения базы) ничего не делает,
// поэтому сборка не падает из-за отсутствия базы.
//
// Миграции нужно выполнять по ПРЯМОМУ подключению: через пулер (PgBouncer, как в пулированном
// DATABASE_URL у Neon) блокировка Prisma может зависнуть. Если провайдер отдаёт ещё и
// DATABASE_URL_UNPOOLED, используем его только для миграции; само приложение в работе
// использует пулированный DATABASE_URL.
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
