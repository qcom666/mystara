import { describe, expect, it, vi } from "vitest";
import { applyBotSetupRequests, buildBotSetupRequests, fetchWebhookInfo } from "./bot-setup";

const SITE = "https://mystara.example";

describe("buildBotSetupRequests", () => {
  it("настраивает команды, описания и кнопку меню на русском и английском", () => {
    const requests = buildBotSetupRequests({ siteUrl: SITE });
    const methods = requests.map((request) => `${request.method}:${String(request.body.language_code ?? "default")}`);
    expect(methods).toEqual([
      "setMyCommands:default",
      "setMyCommands:ru",
      "setMyDescription:default",
      "setMyDescription:ru",
      "setMyShortDescription:default",
      "setMyShortDescription:ru",
      "setChatMenuButton:default",
    ]);
    expect(requests.at(-1)?.body).toEqual({ menu_button: { type: "web_app", text: "Mystara", web_app: { url: SITE } } });
  });

  it("команды совпадают с теми, что понимает бот", () => {
    const commands = buildBotSetupRequests({ siteUrl: SITE })[0].body.commands as { command: string }[];
    expect(commands.map((item) => item.command)).toEqual(["start", "card", "horoscope", "daily", "help", "docs", "support"]);
  });

  it("описания укладываются в лимиты Telegram", () => {
    for (const request of buildBotSetupRequests({ siteUrl: SITE })) {
      if (request.method === "setMyDescription") expect(String(request.body.description).length).toBeLessThanOrEqual(512);
      if (request.method === "setMyShortDescription") expect(String(request.body.short_description).length).toBeLessThanOrEqual(120);
    }
  });

  it("вебхук добавляется только вместе с секретом и подписывается им", () => {
    expect(buildBotSetupRequests({ siteUrl: SITE }).some((request) => request.method === "setWebhook")).toBe(false);
    const webhook = buildBotSetupRequests({ siteUrl: SITE, webhookSecret: "secret-value" }).find((request) => request.method === "setWebhook");
    expect(webhook?.body).toMatchObject({ url: `${SITE}/api/telegram/webhook`, secret_token: "secret-value" });
    // Без "subscription" бот не узнает, что пользователь отключил автопродление в Telegram.
    expect(webhook?.body.allowed_updates).toEqual(["message", "pre_checkout_query", "subscription"]);
  });

  it("отвергает адрес без https или со слэшем в конце", () => {
    for (const bad of ["http://mystara.example", "https://mystara.example/", "mystara.example", "https://a.example/path"]) {
      expect(() => buildBotSetupRequests({ siteUrl: bad })).toThrow(/https/);
    }
  });
});

describe("применение настроек бота", () => {
  it("отправляет запросы по очереди и сообщает результат каждого, без токена в ответе", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, result: true }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: false, description: "Bad Request: wrong url" }), { status: 400 }))
      .mockRejectedValueOnce(new Error("offline"));
    const results = await applyBotSetupRequests(
      "123:SECRET",
      [
        { method: "setMyCommands", body: {} },
        { method: "setMyCommands", body: { language_code: "ru" } },
        { method: "setWebhook", body: {} },
      ],
      fetchImpl as never,
    );
    expect(results).toEqual([
      { label: "setMyCommands", ok: true, error: null },
      { label: "setMyCommands (ru)", ok: false, error: "Bad Request: wrong url" },
      { label: "setWebhook", ok: false, error: "network error" },
    ]);
    expect(JSON.stringify(results)).not.toContain("SECRET");
  });

  it("состояние вебхука: адрес, список обновлений, последняя ошибка", async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ ok: true, result: { url: "https://s.test/api/telegram/webhook", allowed_updates: ["message"], pending_update_count: 2, last_error_message: "Wrong response", last_error_date: 1792300000 } }),
          { status: 200 },
        ),
    );
    await expect(fetchWebhookInfo("t", fetchImpl as never)).resolves.toEqual({
      url: "https://s.test/api/telegram/webhook",
      allowedUpdates: ["message"],
      pendingUpdateCount: 2,
      lastErrorMessage: "Wrong response",
      lastErrorDate: new Date(1792300000 * 1000).toISOString(),
    });
    await expect(fetchWebhookInfo("t", (async () => new Response("{}", { status: 401 })) as never)).resolves.toBeNull();
  });
});
