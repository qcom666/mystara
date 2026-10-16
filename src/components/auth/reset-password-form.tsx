"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";

type Status = "idle" | "loading" | "done" | "invalid-token" | "invalid-input" | "error";

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslation();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>(token ? "idle" : "invalid-token");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("loading");
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (response.ok) setStatus("done");
      else setStatus(body?.error === "invalid_token" ? "invalid-token" : body?.error === "invalid_input" ? "invalid-input" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <GlassPanel className="mx-auto w-full max-w-sm">
      <h1 className="font-display text-2xl text-silver-50">{t.auth.resetTitle}</h1>

      {status === "done" ? (
        <p className="mt-4 text-sm text-emerald-300">{t.auth.resetDone}</p>
      ) : status === "invalid-token" ? (
        <p className="mt-4 text-sm text-red-400">{t.auth.resetInvalid}</p>
      ) : (
        <>
          <p className="mt-1 text-sm text-silver-400">{t.auth.resetSubtitle}</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">{t.auth.newPasswordLabel}</Label>
              <Input
                id="new-password"
                type="password"
                required
                minLength={8}
                maxLength={72}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
              />
            </div>
            {status === "invalid-input" && <p className="text-xs text-red-400">{t.auth.resetInputInvalid}</p>}
            {status === "error" && <p className="text-xs text-red-400">{t.errors.generic}</p>}
            <Button type="submit" className="w-full" disabled={status === "loading"}>
              {status === "loading" ? t.common.loading : t.auth.resetCta}
            </Button>
          </form>
        </>
      )}

      <p className="mt-6 text-center text-sm">
        <Link href={status === "invalid-token" ? "/forgot-password" : "/login"} className="text-gold-300 hover:underline">
          {status === "invalid-token" ? t.auth.forgotLink : t.auth.goToLogin}
        </Link>
      </p>
    </GlassPanel>
  );
}
