import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineConfig } from "prisma/config";
import { buildPrismaCliUrl } from "./src/lib/db-connection";

// В Prisma 7 адрес подключения вынесен из schema.prisma. Этот конфиг используют команды CLI
// (миграции, интроспекция); PrismaClient самого приложения настраивается отдельно через адаптер
// драйвера в src/lib/db.ts. process.env читаем напрямую (а не через `env()` из Prisma), чтобы
// `prisma generate` работал и без заданного DATABASE_URL.
//
// Если хостер базы выдал свой корневой сертификат (DATABASE_SSL_CA), он записывается во временный
// файл: движок миграций принимает сертификат только как путь.
function writeCaFile(pem: string): string {
  const dir = mkdtempSync(join(tmpdir(), "db-ca-"));
  const path = join(dir, "ca.pem");
  writeFileSync(path, pem, { mode: 0o600 });
  return path;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: buildPrismaCliUrl(process.env, writeCaFile),
  },
});
