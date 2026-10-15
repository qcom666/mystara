// Проверка подключения к базе: `npm run db:check`.
// Читает DATABASE_URL (и DATABASE_SSL_CA, если хостер выдал свой сертификат) так же, как само
// приложение, и печатает, к чему удалось подключиться. Пароль не выводится.
import { Pool } from "pg";
import { buildPgConnection } from "../src/lib/db-connection";

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL не задан: проверять нечего.");
    process.exit(1);
  }

  const { connectionString, ssl } = buildPgConnection(process.env);
  const target = new URL(connectionString);
  console.log(`Хост: ${target.hostname}:${target.port || "5432"}, база: ${target.pathname.slice(1)}`);
  console.log(`Проверка сертификата: ${ssl ? "строгая, по DATABASE_SSL_CA" : "как указано в адресе подключения"}`);

  const pool = new Pool({ connectionString, ssl, max: 1, connectionTimeoutMillis: 10_000 });
  try {
    const info = await pool.query<{ version: string; user: string; db: string; ssl: boolean | null }>(
      `select version() as version, current_user as user, current_database() as db,
              (select ssl from pg_stat_ssl where pid = pg_backend_pid()) as ssl`,
    );
    const row = info.rows[0];
    console.log(`Сервер: ${row.version}`);
    console.log(`Пользователь: ${row.user}`);
    console.log(`Шифрование соединения: ${row.ssl ? "включено" : "ВЫКЛЮЧЕНО"}`);

    const tables = await pool.query<{ count: string }>(
      "select count(*)::text as count from information_schema.tables where table_schema = 'public'",
    );
    console.log(`Таблиц в схеме public: ${tables.rows[0].count}`);

    const migrations = await pool
      .query<{ applied: string; last: string | null }>(
        `select count(*)::text as applied, max(migration_name) as last
           from _prisma_migrations where finished_at is not null`,
      )
      .catch(() => null);
    console.log(
      migrations
        ? `Применено миграций: ${migrations.rows[0].applied}, последняя: ${migrations.rows[0].last ?? "-"}`
        : "Таблицы миграций ещё нет: выполните `npx prisma migrate deploy`.",
    );

    const timings: number[] = [];
    for (let i = 0; i < 5; i++) {
      const started = performance.now();
      await pool.query("select 1");
      timings.push(performance.now() - started);
    }
    const average = timings.reduce((sum, value) => sum + value, 0) / timings.length;
    console.log(`Задержка запроса: в среднем ${average.toFixed(0)} мс (5 запросов)`);
    if (!row.ssl) process.exitCode = 2;
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(`Подключиться не удалось: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
