"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n";

/** Самостоятельное удаление аккаунта и отзыв согласия: кнопка, подтверждение и выход. */
export function DeleteAccountSection() {
  const t = useTranslation();
  const a = t.accountPage;
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "deleting" | "error" | "auto-renew">("idle");
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOutEverywhere() {
    setSigningOut(true);
    try {
      await fetch("/api/account/sign-out-everywhere", { method: "POST" });
    } finally {
      await signOut({ callbackUrl: "/login" });
    }
  }

  async function handleDelete() {
    setStatus("deleting");
    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setStatus(body?.error === "auto_renew_cancel_failed" ? "auto-renew" : "error");
        return;
      }
      await signOut({ callbackUrl: "/" });
    } catch {
      setStatus("error");
    }
  }

  return (
    <section>
      <h2 className="font-display text-xl text-silver-100">{a.privacyHeading}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-silver-400">{a.privacyBody}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button type="button" variant="outline" disabled={signingOut} onClick={handleSignOutEverywhere}>
          {signingOut ? t.common.loading : a.signOutEverywhereCta}
        </Button>
        <Button type="button" variant="outline" className="border-red-400/40 text-red-300 hover:bg-red-500/10" onClick={() => setOpen(true)}>
          {a.deleteCta}
        </Button>
      </div>
      <p className="mt-2 text-xs text-silver-500">{a.signOutEverywhereHint}</p>

      <Dialog open={open} onOpenChange={(next) => status !== "deleting" && setOpen(next)}>
        <DialogContent>
          <DialogTitle className="font-display text-xl text-silver-50">{a.deleteDialogTitle}</DialogTitle>
          <DialogDescription className="mt-3 text-sm leading-relaxed text-silver-300">{a.deleteDialogBody}</DialogDescription>
          {status === "error" && <p className="mt-3 text-sm text-red-400">{a.deleteFailed}</p>}
          {status === "auto-renew" && <p className="mt-3 text-sm text-red-400">{a.deleteAutoRenewFailed}</p>}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" disabled={status === "deleting"} onClick={() => setOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-red-400/60 bg-red-500/20 text-red-200 hover:border-red-300 hover:bg-red-500/30 hover:text-red-100"
              disabled={status === "deleting"}
              onClick={handleDelete}
            >
              {status === "deleting" ? a.deleting : a.deleteConfirm}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
