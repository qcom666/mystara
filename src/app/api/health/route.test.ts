import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ configured: true, queryRaw: vi.fn() }));

vi.mock("@/lib/db", () => ({
  isDatabaseConfigured: () => mocks.configured,
  prisma: { $queryRaw: mocks.queryRaw },
}));

import { GET } from "./route";

let counter = 0;
const call = () => GET(new Request("https://site.test/api/health", { headers: { "x-forwarded-for": `198.51.100.${++counter}` } }));

beforeEach(() => {
  mocks.configured = true;
  mocks.queryRaw.mockReset();
});

describe("GET /api/health", () => {
  it("200, если база отвечает", async () => {
    mocks.queryRaw.mockResolvedValue([{ "?column?": 1 }]);
    const response = await call();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "ok", database: "ok" });
  });

  it("503, если база настроена, но не отвечает", async () => {
    mocks.queryRaw.mockRejectedValue(new Error("connection refused"));
    const response = await call();
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ status: "degraded", database: "error" });
  });

  it("без настроенной базы сайт считается живым и не обращается к базе", async () => {
    mocks.configured = false;
    const response = await call();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ database: "not_configured" });
    expect(mocks.queryRaw).not.toHaveBeenCalled();
  });

  it("не раскрывает ничего, кроме состояния и короткой версии", async () => {
    mocks.queryRaw.mockResolvedValue([]);
    expect(Object.keys(await (await call()).json()).sort()).toEqual(["database", "status", "version"]);
  });
});
