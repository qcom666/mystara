/**
 * Параметры подключения к PostgreSQL, в том числе к управляемой базе в РФ с собственным корневым
 * сертификатом хостера.
 *
 * Адрес базы приходит в `DATABASE_URL`. Если хостер выдаёт свой корневой сертификат, его текст
 * кладётся в `DATABASE_SSL_CA` (PEM как есть, с `\n` вместо переводов строк или в base64): тогда
 * соединение проверяется строго, по этому сертификату и имени хоста.
 *
 * Драйвер `pg` разбирает адрес и перезаписывает им явно переданные параметры, поэтому при заданном
 * сертификате ssl-параметры вырезаются из адреса: иначе `sslmode=...` из строки подключения
 * заменил бы наши настройки проверки.
 */

const PLACEHOLDER_URL = "postgresql://localhost:5432/not-configured";

/** Параметры адреса, которые отвечают за SSL и должны уступить явной настройке сертификата. */
const SSL_QUERY_PARAMS = [
  "ssl",
  "sslmode",
  "sslcert",
  "sslkey",
  "sslrootcert",
  "sslaccept",
  "sslnegotiation",
  "uselibpqcompat",
];

export interface PgSslConfig {
  ca: string;
  rejectUnauthorized: true;
}

export interface PgConnection {
  connectionString: string;
  /** Задан только когда указан сертификат хостера; иначе SSL определяет сам адрес подключения. */
  ssl?: PgSslConfig;
}

/** Приводит значение переменной окружения к PEM: понимает `\n` в одну строку и base64. */
export function normalizePem(raw: string | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;

  const text = value.includes("-----BEGIN") ? value : decodeBase64(value);
  if (!text?.includes("-----BEGIN CERTIFICATE-----")) {
    throw new Error("DATABASE_SSL_CA не похож на сертификат PEM (нет блока BEGIN CERTIFICATE)");
  }
  return `${text.replace(/\\n/g, "\n").trim()}\n`;
}

function decodeBase64(value: string): string | null {
  try {
    return Buffer.from(value, "base64").toString("utf8");
  } catch {
    return null;
  }
}

/** Убирает из адреса подключения параметры SSL, сохраняя остальные. */
export function stripSslParams(connectionString: string): string {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    return connectionString;
  }
  for (const name of SSL_QUERY_PARAMS) url.searchParams.delete(name);
  return url.toString();
}

/**
 * Адрес для CLI Prisma (миграции). Движок миграций читает сертификат из файла, поэтому PEM записывается
 * через `writeCaFile` (возвращает путь), а в адрес добавляются `sslmode=require`, `sslcert` и
 * `sslaccept=strict`: без `strict` Prisma принимает любой сертификат, и проверка была бы формальной.
 * Без сертификата хостера адрес возвращается как есть. Без адреса возвращается `undefined`.
 */
export function buildPrismaCliUrl(
  env: Record<string, string | undefined>,
  writeCaFile: (pem: string) => string,
): string | undefined {
  const connectionString = env.DATABASE_URL;
  if (!connectionString) return undefined;

  const ca = normalizePem(env.DATABASE_SSL_CA);
  if (!ca) return connectionString;

  const url = new URL(stripSslParams(connectionString));
  url.searchParams.set("sslmode", "require");
  url.searchParams.set("sslcert", writeCaFile(ca));
  url.searchParams.set("sslaccept", "strict");
  return url.toString();
}

export function buildPgConnection(env: Record<string, string | undefined>): PgConnection {
  const connectionString = env.DATABASE_URL ?? PLACEHOLDER_URL;
  const ca = normalizePem(env.DATABASE_SSL_CA);
  if (!ca) return { connectionString };

  return {
    connectionString: stripSslParams(connectionString),
    ssl: { ca, rejectUnauthorized: true },
  };
}
