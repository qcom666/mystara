import { describe, expect, it } from "vitest";
import { buildPgConnection, buildPrismaCliUrl, normalizePem, stripSslParams } from "./db-connection";

const PEM = "-----BEGIN CERTIFICATE-----\nMIIBszCCAVmgAwIBAgIUdGVzdA==\n-----END CERTIFICATE-----";

describe("buildPgConnection", () => {
  it("без сертификата оставляет адрес как есть и не задаёт ssl", () => {
    const url = "postgresql://u:p@db.example.ru:5432/app?sslmode=require";
    expect(buildPgConnection({ DATABASE_URL: url })).toEqual({ connectionString: url });
  });

  it("без адреса возвращает заглушку, чтобы приложение запускалось без базы", () => {
    const result = buildPgConnection({});
    expect(result.connectionString).toContain("not-configured");
    expect(result.ssl).toBeUndefined();
  });

  it("с сертификатом включает строгую проверку и убирает ssl-параметры из адреса", () => {
    const result = buildPgConnection({
      DATABASE_URL: "postgresql://u:p@db.example.ru:5432/app?sslmode=require&connection_limit=5",
      DATABASE_SSL_CA: PEM,
    });
    expect(result.ssl?.rejectUnauthorized).toBe(true);
    expect(result.ssl?.ca).toContain("BEGIN CERTIFICATE");
    expect(result.connectionString).not.toContain("sslmode");
    expect(result.connectionString).toContain("connection_limit=5");
    expect(result.connectionString).toContain("u:p@db.example.ru:5432/app");
  });

  it("понимает сертификат с \\n вместо переводов строк", () => {
    const escaped = PEM.replace(/\n/g, "\\n");
    const result = buildPgConnection({ DATABASE_URL: "postgresql://u@h/db", DATABASE_SSL_CA: escaped });
    expect(result.ssl?.ca).toBe(`${PEM}\n`);
  });

  it("понимает сертификат в base64", () => {
    const b64 = Buffer.from(PEM, "utf8").toString("base64");
    const result = buildPgConnection({ DATABASE_URL: "postgresql://u@h/db", DATABASE_SSL_CA: b64 });
    expect(result.ssl?.ca).toBe(`${PEM}\n`);
  });

  it("пустое значение сертификата считается незаданным", () => {
    expect(buildPgConnection({ DATABASE_URL: "postgresql://u@h/db", DATABASE_SSL_CA: "  " }).ssl).toBeUndefined();
  });

  it("отвергает значение, которое не является сертификатом", () => {
    expect(() => normalizePem("просто текст")).toThrow(/DATABASE_SSL_CA/);
  });
});

describe("buildPrismaCliUrl", () => {
  const writeCaFile = (pem: string) => {
    expect(pem).toContain("BEGIN CERTIFICATE");
    return "/tmp/ca.pem";
  };

  it("без адреса возвращает undefined (prisma generate работает без базы)", () => {
    expect(buildPrismaCliUrl({}, writeCaFile)).toBeUndefined();
  });

  it("без сертификата возвращает адрес без изменений", () => {
    const url = "postgresql://u:p@h:5432/db?sslmode=require";
    expect(buildPrismaCliUrl({ DATABASE_URL: url }, writeCaFile)).toBe(url);
  });

  it("с сертификатом включает строгую проверку по файлу сертификата", () => {
    const result = buildPrismaCliUrl(
      { DATABASE_URL: "postgresql://u:p@h:5432/db?sslmode=disable&schema=public", DATABASE_SSL_CA: PEM },
      writeCaFile,
    );
    const url = new URL(result as string);
    expect(url.searchParams.get("sslmode")).toBe("require");
    expect(url.searchParams.get("sslcert")).toBe("/tmp/ca.pem");
    expect(url.searchParams.get("sslaccept")).toBe("strict");
    expect(url.searchParams.get("schema")).toBe("public");
  });
});

describe("stripSslParams", () => {
  it("убирает все ssl-параметры и не трогает остальные", () => {
    const stripped = stripSslParams(
      "postgresql://u:p@h:5432/db?sslmode=verify-full&sslrootcert=/x.pem&schema=public&uselibpqcompat=true",
    );
    expect(stripped).toBe("postgresql://u:p@h:5432/db?schema=public");
  });

  it("если адрес не разбирается, возвращает его без изменений", () => {
    expect(stripSslParams("не адрес")).toBe("не адрес");
  });
});
