import { describe, expect, it } from "vitest";
import { buildBotSetupRequests } from "./bot-setup";

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
    expect(commands.map((item) => item.command)).toEqual(["start", "card", "daily", "help", "docs", "support"]);
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
  });

  it("отвергает адрес без https или со слэшем в конце", () => {
    for (const bad of ["http://mystara.example", "https://mystara.example/", "mystara.example", "https://a.example/path"]) {
      expect(() => buildBotSetupRequests({ siteUrl: bad })).toThrow(/https/);
    }
  });
});
