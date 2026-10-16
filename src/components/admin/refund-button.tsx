"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const ERRORS: Record<string, string> = {
  invalid_input: "Нужна причина возврата (от 3 символов).",
  not_found: "Покупка не найдена.",
  not_paid: "Возврат возможен только для оплаченной покупки.",
  already_refunded: "Эта покупка уже возвращена.",
  not_configured: "Способ оплаты не настроен (нет ключей в окружении).",
  no_telegram_user: "У пользователя нет Telegram ID: Звёзды вернуть нельзя.",
  provider_failed: "Платёжная система не приняла возврат. Деньги и выданное не тронуты.",
};

/** Возврат оплаченной покупки: запрашивает причину, возвращает деньги через платёжную систему и забирает выданное. */
export function RefundButton({ purchaseId }: { purchaseId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    const reason = window.prompt("Причина возврата (попадёт в журнал). Деньги вернутся покупателю, выданные кредиты или срок Premium будут сняты.");
    if (reason === null) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/purchases/${purchaseId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string; status?: string } | null;
      if (!response.ok) {
        window.alert(ERRORS[data?.error ?? ""] ?? `Ошибка ${response.status}`);
      } else {
        if (data?.status === "pending") window.alert("Возврат принят платёжной системой и обрабатывается. Статус изменится после её уведомления.");
        router.refresh();
      }
    } catch {
      window.alert("Не удалось связаться с сервером.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={onClick} disabled={busy} className="rounded-lg border border-red-400/40 px-3 py-1 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50">
      {busy ? "…" : "Вернуть"}
    </button>
  );
}
