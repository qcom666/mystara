"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";

interface WebhookInfo {
  url: string;
  allowedUpdates: string[] | null;
  pendingUpdateCount: number;
  lastErrorMessage: string | null;
  lastErrorDate: string | null;
}

interface SetupResult {
  label: string;
  ok: boolean;
  error: string | null;
}

const NEEDED_UPDATES = ["message", "pre_checkout_query", "subscription"];

/**
 * Настройка бота ключами с сервера (команды, описания, кнопка меню, вебхук): то же, что
 * `npm run bot:setup -- --webhook`, но без скачивания скрытых переменных Vercel на компьютер.
 */
export function BotSetupPanel() {
  const [webhook, setWebhook] = useState<WebhookInfo | null | undefined>(undefined);
  const [siteUrl, setSiteUrl] = useState<string | null>(null);
  const [results, setResults] = useState<SetupResult[] | null>(null);
  const [state, setState] = useState<"idle" | "running" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/bot-setup")
      .then(async (response) => {
        const data = (await response.json().catch(() => null)) as { webhook?: WebhookInfo | null; siteUrl?: string; error?: string } | null;
        if (!response.ok) {
          setError(data?.error ?? `HTTP ${response.status}`);
          setWebhook(null);
          return;
        }
        setWebhook(data?.webhook ?? null);
        setSiteUrl(data?.siteUrl ?? null);
      })
      .catch(() => setWebhook(null));
  }, []);

  async function apply() {
    setState("running");
    setError(null);
    const response = await fetch("/api/admin/bot-setup", { method: "POST" }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { results?: SetupResult[]; webhook?: WebhookInfo | null; error?: string } | null;
    if (!response?.ok || !data?.results) {
      setState("error");
      setError(data?.error ?? "request_failed");
      return;
    }
    setResults(data.results);
    setWebhook(data.webhook ?? null);
    setState("idle");
  }

  const missing = webhook?.allowedUpdates ? NEEDED_UPDATES.filter((update) => !webhook.allowedUpdates?.includes(update)) : [];

  return (
    <GlassPanel>
      <h2 className="font-display text-xl text-silver-100">Бот Telegram</h2>
      <p className="mt-1 text-sm text-silver-400">
        Команды, описание, кнопка меню и вебхук. Ключи берутся из окружения Vercel и никуда не передаются.
      </p>

      <div className="mt-4 space-y-1 text-sm">
        {webhook === undefined ? (
          <p className="text-silver-500">Загружаем состояние вебхука…</p>
        ) : webhook === null ? (
          <p className="text-red-400">Не удалось узнать состояние вебхука{error ? `: ${error}` : ""}.</p>
        ) : (
          <>
            <p className="text-silver-300">
              Вебхук: <span className="break-all text-silver-100">{webhook.url || "не задан"}</span>
            </p>
            <p className="text-silver-300">
              Обновления: <span className="text-silver-100">{webhook.allowedUpdates ? webhook.allowedUpdates.join(", ") : "все обычные (список не задан)"}</span>
            </p>
            {missing.length > 0 && <p className="text-gold-300">Не хватает: {missing.join(", ")} — нажмите «Обновить настройки бота».</p>}
            {webhook.pendingUpdateCount > 0 && <p className="text-silver-300">В очереди у Telegram: {webhook.pendingUpdateCount}</p>}
            {webhook.lastErrorMessage && (
              <p className="text-red-400">
                Последняя ошибка доставки: {webhook.lastErrorMessage}
                {webhook.lastErrorDate ? ` (${new Date(webhook.lastErrorDate).toLocaleString("ru-RU")})` : ""}
              </p>
            )}
          </>
        )}
      </div>

      <Button className="mt-4" onClick={() => void apply()} disabled={state === "running"}>
        {state === "running" ? "Применяем…" : "Обновить настройки бота"}
      </Button>
      {siteUrl && <p className="mt-2 text-xs text-silver-500">Адрес сайта для кнопки меню и вебхука: {siteUrl}</p>}
      {state === "error" && <p className="mt-2 text-sm text-red-400">Не получилось: {error}</p>}

      {results && (
        <ul className="mt-4 space-y-1 text-sm">
          {results.map((result, index) => (
            <li key={`${result.label}-${index}`} className={result.ok ? "text-silver-300" : "text-red-400"}>
              {result.ok ? "✓" : "✗"} {result.label}
              {result.error ? `: ${result.error}` : ""}
            </li>
          ))}
        </ul>
      )}
    </GlassPanel>
  );
}
