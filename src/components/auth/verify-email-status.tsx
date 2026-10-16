"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useTranslation } from "@/lib/i18n";

type Status = "checking" | "done" | "invalid";

/** Подтверждает адрес по ссылке из письма: токен отправляется при открытии страницы, а не по клику. */
export function VerifyEmailStatus({ token }: { token: string }) {
  const t = useTranslation();
  const [status, setStatus] = useState<Status>(token ? "checking" : "invalid");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch("/api/auth/verify-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) })
      .then((response) => {
        if (!cancelled) setStatus(response.ok ? "done" : "invalid");
      })
      .catch(() => {
        if (!cancelled) setStatus("invalid");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <GlassPanel className="mx-auto w-full max-w-sm text-center">
      <h1 className="font-display text-2xl text-silver-50">{t.auth.verifyTitle}</h1>
      <p className={`mt-4 text-sm ${status === "done" ? "text-emerald-300" : status === "invalid" ? "text-red-400" : "text-silver-400"}`}>
        {status === "checking" ? t.auth.verifyChecking : status === "done" ? t.auth.verifyDone : t.auth.verifyInvalid}
      </p>
      <p className="mt-6 text-sm">
        <Link href="/account" className="text-gold-300 hover:underline">
          {t.nav.account}
        </Link>
      </p>
    </GlassPanel>
  );
}
