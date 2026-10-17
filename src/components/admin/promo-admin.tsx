"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

export interface PromoRow {
  id: string;
  code: string;
  kind: string;
  amount: number;
  used: number;
  max: number | null;
  expires: string | null;
  active: boolean;
  note: string | null;
}

const ERRORS: Record<string, string> = {
  invalid_input: "Проверьте поля: код 3-32 символа (буквы, цифры, дефис), количество 1-365.",
  invalid_code: "Код может состоять только из латинских букв, цифр и дефиса (3-32 символа).",
  code_taken: "Такой код уже есть.",
};

const inputClass = "rounded-lg border border-white/10 bg-midnight-900 px-3 py-2 text-sm text-silver-100 placeholder:text-silver-500";
const buttonClass = "rounded-lg border border-gold-500/40 px-4 py-2 text-sm text-gold-300 hover:bg-gold-500/10 disabled:opacity-50";

/** Админ-панель промокодов: бонус - кредиты натальной карты или дни Premium, а не скидка на оплату. */
export function PromoAdmin({ codes }: { codes: PromoRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const max = String(data.get("max") ?? "").trim();
    const expires = String(data.get("expires") ?? "").trim();
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/admin/promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: String(data.get("code") ?? ""),
        kind: String(data.get("kind") ?? "natal_credits"),
        amount: Number(data.get("amount")),
        maxRedemptions: max ? Number(max) : null,
        expiresAt: expires || null,
        note: String(data.get("note") ?? "") || null,
      }),
    }).catch(() => null);
    setBusy(false);
    if (response?.ok) {
      form.reset();
      setMessage({ kind: "ok", text: "Промокод создан." });
      router.refresh();
    } else {
      const body = (await response?.json().catch(() => null)) as { error?: string } | null;
      setMessage({ kind: "error", text: ERRORS[body?.error ?? ""] ?? "Не удалось создать промокод." });
    }
  }

  async function toggle(id: string, active: boolean) {
    setBusy(true);
    await fetch(`/api/admin/promo/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active }) }).catch(() => null);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl text-silver-50">Промокоды</h1>

      <form onSubmit={onCreate} className="grid max-w-3xl gap-3 sm:grid-cols-3">
        <input name="code" required placeholder="Код, например START2026" className={inputClass} maxLength={32} />
        <select name="kind" className={inputClass} defaultValue="natal_credits">
          <option value="natal_credits">Кредиты натальной карты</option>
          <option value="premium_days">Дни Premium</option>
        </select>
        <input name="amount" required type="number" min={1} max={365} placeholder="Сколько" className={inputClass} />
        <input name="max" type="number" min={1} placeholder="Лимит активаций (пусто - без лимита)" className={inputClass} />
        <input name="expires" type="date" className={inputClass} aria-label="Действует до (включительно)" />
        <input name="note" placeholder="Заметка для себя" className={inputClass} maxLength={200} />
        <button type="submit" disabled={busy} className={buttonClass}>
          Создать
        </button>
        {message && <p className={`text-sm sm:col-span-3 ${message.kind === "ok" ? "text-emerald-300" : "text-red-400"}`}>{message.text}</p>}
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-silver-500">
            <tr>
              <th className="py-2">Код</th>
              <th>Бонус</th>
              <th>Использовано</th>
              <th>До</th>
              <th>Заметка</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {codes.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-silver-500">
                  Промокодов пока нет.
                </td>
              </tr>
            )}
            {codes.map((code) => (
              <tr key={code.id} className={code.active ? "" : "opacity-50"}>
                <td className="py-2 font-mono text-silver-100">{code.code}</td>
                <td className="text-silver-300">{code.kind === "premium_days" ? `${code.amount} дн. Premium` : `${code.amount} кредит(а)`}</td>
                <td className="text-silver-300">
                  {code.used}
                  {code.max !== null ? ` / ${code.max}` : ""}
                </td>
                <td className="text-silver-400">{code.expires ?? "—"}</td>
                <td className="text-silver-400">{code.note ?? ""}</td>
                <td className="text-right">
                  <button type="button" disabled={busy} onClick={() => toggle(code.id, !code.active)} className="text-xs text-gold-300 hover:underline">
                    {code.active ? "Отключить" : "Включить"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
