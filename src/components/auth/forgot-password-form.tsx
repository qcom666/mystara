"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";

type Status = "idle" | "loading" | "sent" | "unavailable" | "error";

export function ForgotPasswordForm({ mailConfigured }: { mailConfigured: boolean }) {
  const t = useTranslation();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>(mailConfigured ? "idle" : "unavailable");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("loading");
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(response.ok ? "sent" : response.status === 503 ? "unavailable" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <GlassPanel className="mx-auto w-full max-w-sm">
      <h1 className="font-display text-2xl text-silver-50">{t.auth.forgotTitle}</h1>
      <p className="mt-1 text-sm text-silver-400">{t.auth.forgotSubtitle}</p>

      {status === "sent" ? (
        <p className="mt-6 text-sm text-emerald-300">{t.auth.forgotSent}</p>
      ) : status === "unavailable" ? (
        <p className="mt-6 text-sm text-silver-300">{t.auth.forgotUnavailable}</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="forgot-email">{t.auth.emailLabel}</Label>
            <Input id="forgot-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
          </div>
          {status === "error" && <p className="text-xs text-red-400">{t.auth.forgotFailed}</p>}
          <Button type="submit" className="w-full" disabled={status === "loading"}>
            {status === "loading" ? t.common.loading : t.auth.forgotCta}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="text-gold-300 hover:underline">
          {t.auth.goToLogin}
        </Link>
      </p>
    </GlassPanel>
  );
}
