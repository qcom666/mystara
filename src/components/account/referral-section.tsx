"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useTranslation } from "@/lib/i18n";
import type { ReferralInfo } from "./account-view";

/** Ссылки приглашения и счётчик приглашённых. Бонус - кредит натальной карты за первую оплату друга. */
export function ReferralSection({ referral, botUsername }: { referral: ReferralInfo; botUsername: string }) {
  const t = useTranslation();
  const a = t.accountPage;
  const [copied, setCopied] = useState<string | null>(null);
  if (!referral.code) return null;

  // Адрес сайта подставляется при сборке, поэтому одинаков на сервере и в браузере (без расхождения при гидратации).
  const origin = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");
  const links = [
    { id: "site", label: a.referralSiteLink, url: `${origin}/?ref=${referral.code}` },
    ...(botUsername ? [{ id: "telegram", label: a.referralTelegramLink, url: `https://t.me/${botUsername}?startapp=ref_${referral.code}` }] : []),
  ];

  async function copy(id: string, url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      window.prompt(a.referralCopyPrompt, url);
    }
  }

  return (
    <section>
      <h2 className="font-display text-xl text-silver-100">{a.referralHeading}</h2>
      <p className="mt-2 max-w-2xl text-sm text-silver-400">{a.referralBody}</p>
      <div className="mt-3 space-y-2">
        {links.map((link) => (
          <GlassPanel key={link.id} padding="sm" className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-silver-500">{link.label}</p>
              <p className="truncate text-sm text-silver-100">{link.url}</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => copy(link.id, link.url)}>
              {copied === link.id ? a.referralCopied : a.referralCopy}
            </Button>
          </GlassPanel>
        ))}
      </div>
      <p className="mt-2 text-xs text-silver-500">{a.referralStats.replace("{invited}", String(referral.invited)).replace("{rewarded}", String(referral.rewarded))}</p>
    </section>
  );
}
