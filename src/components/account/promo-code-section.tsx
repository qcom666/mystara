"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/lib/i18n";

type Message = { kind: "ok" | "error"; text: string } | null;

/** Ввод промокода: бонус (кредиты натальной карты или дни Premium) начисляется сразу. */
export function PromoCodeSection() {
  const t = useTranslation();
  const a = t.accountPage;
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/account/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string; kind?: string; amount?: number } | null;
      if (response.ok && body?.kind) {
        const text = (body.kind === "premium_days" ? a.promoDonePremium : a.promoDoneCredits).replace("{amount}", String(body.amount ?? ""));
        setMessage({ kind: "ok", text });
        setCode("");
        router.refresh();
      } else {
        const errors: Record<string, string> = {
          not_found: a.promoNotFound,
          invalid_code: a.promoNotFound,
          inactive: a.promoInactive,
          expired: a.promoExpired,
          exhausted: a.promoExhausted,
          already_used: a.promoAlreadyUsed,
          rate_limited: a.promoRateLimited,
        };
        setMessage({ kind: "error", text: errors[body?.error ?? ""] ?? t.errors.generic });
      }
    } catch {
      setMessage({ kind: "error", text: t.errors.generic });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h2 className="font-display text-xl text-silver-100">{a.promoHeading}</h2>
      <form onSubmit={onSubmit} className="mt-3 flex max-w-sm gap-2">
        <Input value={code} onChange={(event) => setCode(event.target.value)} placeholder={a.promoPlaceholder} maxLength={32} aria-label={a.promoHeading} />
        <Button type="submit" disabled={busy || code.trim().length < 3}>
          {busy ? t.common.loading : a.promoCta}
        </Button>
      </form>
      {message && <p className={`mt-2 text-sm ${message.kind === "ok" ? "text-emerald-300" : "text-red-400"}`}>{message.text}</p>}
    </section>
  );
}
