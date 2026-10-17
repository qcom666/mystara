"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n";
import type { AccountData } from "@/lib/repositories/account.repository";

type AutoRenew = NonNullable<AccountData["premium"]["autoRenew"]>;

/**
 * Автопродление Premium в кабинете: включено ли и когда следующее списание, кнопка «Отключить» с подтверждением.
 * Отключает бот (DELETE /api/subscription/auto-renew); оплаченный срок дослуживает до конца.
 */
export function AutoRenewControl({ autoRenew, premiumUntil, formatDate }: { autoRenew: AutoRenew; premiumUntil: string | null; formatDate: (iso: string) => string }) {
  const t = useTranslation();
  const a = t.accountPage;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (autoRenew.state !== "active") {
    return <p className="mt-3 text-xs text-silver-400">{autoRenew.state === "failed" ? a.autoRenewFailed : a.autoRenewOff}</p>;
  }

  const until = formatDate(premiumUntil ?? autoRenew.expiresAt);

  async function handleCancel() {
    setBusy(true);
    setError(null);
    const response = await fetch("/api/subscription/auto-renew", { method: "DELETE" }).catch(() => null);
    setBusy(false);
    if (response?.ok || response?.status === 404) {
      setOpen(false);
      router.refresh();
      return;
    }
    setError(response?.status === 409 ? a.cancelAutoRenewRejected : a.cancelAutoRenewFailed);
  }

  return (
    <div className="mt-3">
      <p className="text-xs text-silver-400">
        {a.autoRenewOn.replace("{date}", formatDate(autoRenew.expiresAt)).replace("{price}", `${autoRenew.amount} ⭐`)}
      </p>
      {autoRenew.cancelable ? (
        <Button type="button" variant="ghost" size="sm" className="mt-2 px-0 text-silver-300 hover:text-silver-100" onClick={() => setOpen(true)}>
          {a.cancelAutoRenewCta}
        </Button>
      ) : (
        <p className="mt-1 text-xs text-silver-500">{a.cancelAutoRenewInTelegram}</p>
      )}

      <Dialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
        <DialogContent>
          <DialogTitle className="font-display text-xl text-silver-50">{a.cancelAutoRenewTitle}</DialogTitle>
          <DialogDescription className="mt-3 text-sm leading-relaxed text-silver-300">{a.cancelAutoRenewBody.replace("{date}", until)}</DialogDescription>
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" disabled={busy} onClick={() => setOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button type="button" variant="outline" disabled={busy} onClick={handleCancel}>
              {busy ? a.cancelAutoRenewing : a.cancelAutoRenewConfirm}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
