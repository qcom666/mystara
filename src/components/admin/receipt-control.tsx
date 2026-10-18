"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const ERRORS: Record<string, string> = {
  invalid_url: "Нужна ссылка на чек из «Мой налог»: https://lknpd.nalog.ru/…",
  not_found: "Покупка не найдена.",
  not_paid: "Чек ведётся только у оплаченной покупки.",
  no_receipt: "Сначала сохраните ссылку на чек.",
  no_channel: "У покупателя нет Telegram и e-mail (или не настроена почта).",
  delivery_failed: "Не доставлено: бот и почта не приняли сообщение. Попробуйте позже.",
  conflict: "Покупка изменилась, пока шла отправка. Обновите страницу.",
  rate_limited: "Слишком много запросов. Подождите немного.",
};

const CHANNEL_LABELS: Record<string, string> = { telegram: "Telegram", email: "e-mail", manual: "вручную" };

interface ReceiptControlProps {
  purchaseId: string;
  receiptUrl: string | null;
  /** Когда чек отправлен (уже отформатировано на сервере); null — ещё не выдан. */
  sentAt: string | null;
  /** Последний день срока выдачи, например «09.11.2026». */
  dueDay: string;
  overdue: boolean;
  /** Чем можно отправить: "telegram", "email". Пусто — только отметить выданным вручную. */
  channels: string[];
}

async function request(url: string, method: string, body: unknown): Promise<{ ok: boolean; error?: string; channels?: string[] }> {
  const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = (await response.json().catch(() => null)) as { error?: string; channels?: string[] } | null;
  return response.ok ? { ok: true, channels: data?.channels } : { ok: false, error: data?.error ?? `http_${response.status}` };
}

/** Ссылка на чек «Мой налог» у оплаченной покупки и отправка её покупателю. */
export function ReceiptControl({ purchaseId, receiptUrl, sentAt, dueDay, overdue, channels }: ReceiptControlProps) {
  const router = useRouter();
  const [value, setValue] = useState(receiptUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const base = `/api/admin/purchases/${purchaseId}/receipt`;
  const dirty = value.trim() !== (receiptUrl ?? "");

  const fail = (error: string | undefined) => setMessage({ text: ERRORS[error ?? ""] ?? `Ошибка: ${error}`, error: true });

  async function save(): Promise<boolean> {
    const url = value.trim();
    if (!url) {
      fail("no_receipt");
      return false;
    }
    if (!dirty) return true;
    const result = await request(base, "PUT", { url });
    if (!result.ok) fail(result.error);
    return result.ok;
  }

  async function run(action: "save" | "send") {
    setBusy(true);
    setMessage(null);
    try {
      if (!(await save())) return;
      if (action === "save") {
        setMessage({ text: "Ссылка сохранена.", error: false });
        router.refresh();
        return;
      }
      const manual = channels.length === 0;
      if (manual && !window.confirm("Отправить чек из сервиса нельзя: у покупателя нет Telegram и e-mail (или не настроена почта). Отметить чек выданным, если вы передали его сами?")) {
        router.refresh();
        return;
      }
      const result = await request(`${base}/send`, "POST", { manual });
      if (!result.ok) {
        fail(result.error);
      } else {
        setMessage({ text: `Чек выдан: ${(result.channels ?? []).map((channel) => CHANNEL_LABELS[channel] ?? channel).join(", ")}.`, error: false });
      }
      router.refresh();
    } catch {
      setMessage({ text: "Не удалось связаться с сервером.", error: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-60 space-y-1">
      <input
        type="url"
        inputMode="url"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="https://lknpd.nalog.ru/…"
        aria-label="Ссылка на чек «Мой налог»"
        className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-silver-100 placeholder:text-silver-500 focus:border-gold-400 focus:outline-none"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => run("send")}
          disabled={busy || !value.trim()}
          className="whitespace-nowrap rounded-lg border border-gold-400/50 px-2 py-1 text-xs text-gold-300 hover:bg-gold-400/10 disabled:opacity-50"
        >
          {busy ? "…" : channels.length === 0 ? "Отметить выданным" : sentAt && !dirty ? "Отправить ещё раз" : "Отправить покупателю"}
        </button>
        {dirty && (
          <button
            type="button"
            onClick={() => run("save")}
            disabled={busy}
            className="rounded-lg border border-white/15 px-2 py-1 text-xs text-silver-300 hover:text-silver-100 disabled:opacity-50"
          >
            Сохранить
          </button>
        )}
      </div>
      <p className="text-xs text-silver-500">
        {sentAt ? (
          <span className="text-emerald-300">Выдан {sentAt}</span>
        ) : overdue ? (
          <span className="text-red-300">Срок прошёл: чек нужно было выдать до конца {dueDay}</span>
        ) : (
          <span>Выдать до конца {dueDay}</span>
        )}
        {" · "}
        {channels.length > 0 ? channels.map((channel) => CHANNEL_LABELS[channel] ?? channel).join(" и ") : "нет связи с покупателем"}
      </p>
      {message && <p className={`text-xs ${message.error ? "text-red-300" : "text-emerald-300"}`}>{message.text}</p>}
    </div>
  );
}
