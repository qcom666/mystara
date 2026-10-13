"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Result = { kind: "ok" | "error"; text: string } | null;

const ERRORS: Record<string, string> = {
  invalid_input: "Проверьте поля: нужна причина (от 3 символов) и корректное число.",
  negative_balance: "Нельзя уменьшить кредиты ниже нуля.",
  not_found: "Пользователь или подписка не найдены.",
};

async function post(url: string, body: unknown): Promise<Result> {
  try {
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (response.ok) return { kind: "ok", text: "Готово: действие выполнено и записано в журнал." };
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    return { kind: "error", text: ERRORS[data?.error ?? ""] ?? `Ошибка ${response.status}` };
  } catch {
    return { kind: "error", text: "Не удалось связаться с сервером." };
  }
}

const inputClass = "rounded-lg border border-white/10 bg-midnight-900 px-3 py-2 text-sm text-silver-100 placeholder:text-silver-500";
const buttonClass = "rounded-lg border border-gold-500/40 px-4 py-2 text-sm text-gold-300 hover:bg-gold-500/10 disabled:opacity-50";

/** Ручные действия над пользователем. Каждое требует причину и попадает в журнал; права проверяет сервер. */
export function UserActions({ userId }: { userId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>(null);

  async function run(url: string, body: unknown, form?: HTMLFormElement) {
    setBusy(true);
    setResult(null);
    const outcome = await post(url, body);
    setBusy(false);
    setResult(outcome);
    if (outcome?.kind === "ok") {
      form?.reset();
      router.refresh();
    }
  }

  function onCredits(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    void run(`/api/admin/users/${userId}/credits`, { delta: Number(data.get("delta")), reason: String(data.get("reason") ?? "") }, form);
  }

  function onExtend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    void run(`/api/admin/users/${userId}/premium`, { action: "extend", days: Number(data.get("days")), reason: String(data.get("reason") ?? "") }, form);
  }

  function onEnd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!window.confirm("Прекратить Premium прямо сейчас?")) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    void run(`/api/admin/users/${userId}/premium`, { action: "end", reason: String(data.get("reason") ?? "") }, form);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onCredits} className="space-y-2">
        <p className="text-sm text-silver-200">Кредиты натальной карты</p>
        <p className="text-xs text-silver-500">Положительное число начисляет, отрицательное списывает (например, после возврата платежа).</p>
        <div className="flex flex-wrap gap-2">
          <input name="delta" type="number" step={1} min={-1000} max={1000} required placeholder="+3" className={`${inputClass} w-24`} />
          <input name="reason" required minLength={3} maxLength={200} placeholder="Причина" className={`${inputClass} min-w-48 flex-1`} />
          <button type="submit" disabled={busy} className={buttonClass}>
            Применить
          </button>
        </div>
      </form>

      <form onSubmit={onExtend} className="space-y-2">
        <p className="text-sm text-silver-200">Продлить Premium</p>
        <div className="flex flex-wrap gap-2">
          <input name="days" type="number" step={1} min={1} max={365} required defaultValue={30} className={`${inputClass} w-24`} />
          <input name="reason" required minLength={3} maxLength={200} placeholder="Причина" className={`${inputClass} min-w-48 flex-1`} />
          <button type="submit" disabled={busy} className={buttonClass}>
            Продлить на дни
          </button>
        </div>
      </form>

      <form onSubmit={onEnd} className="space-y-2">
        <p className="text-sm text-silver-200">Прекратить Premium сейчас</p>
        <div className="flex flex-wrap gap-2">
          <input name="reason" required minLength={3} maxLength={200} placeholder="Причина (например, возврат платежа)" className={`${inputClass} min-w-48 flex-1`} />
          <button type="submit" disabled={busy} className="rounded-lg border border-red-400/40 px-4 py-2 text-sm text-red-300 hover:bg-red-400/10 disabled:opacity-50">
            Прекратить
          </button>
        </div>
      </form>

      {result && <p className={`text-sm ${result.kind === "ok" ? "text-gold-300" : "text-red-400"}`}>{result.text}</p>}
    </div>
  );
}
