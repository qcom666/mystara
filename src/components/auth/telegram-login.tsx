"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { TelegramWidget } from "@/components/auth/telegram-widget";
import { ConsentCheckbox } from "@/components/legal/consent-checkbox";
import { useTranslation } from "@/lib/i18n";
import { setPrivacyConsent, usePrivacyConsent } from "@/lib/legal/use-privacy-consent";
import { getRememberedReferral } from "@/lib/referral-client";

interface TelegramLoginSectionProps {
  /** Имя бота без @ (NEXT_PUBLIC_TELEGRAM_BOT_USERNAME). Домен сайта должен быть привязан к боту через /setdomain в BotFather. */
  botUsername: string;
}

type Status = "idle" | "signing-in" | "error";

/**
 * Раздел формы входа с официальным виджетом «Войти через Telegram». Аккаунт создаётся при первом входе, поэтому,
 * пока на этом устройстве нет согласия с текущей версией политики, кнопка показывается только после
 * того, как пользователь сам поставит галочку.
 */
export function TelegramLoginSection({ botUsername }: TelegramLoginSectionProps) {
  const t = useTranslation();
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const consent = usePrivacyConsent();
  const [ticked, setTicked] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const redirected = useRef(false);

  const consentGiven = consent === "accepted" || ticked;

  // Один переход после входа: без защиты эффект срабатывал бы на каждой перерисовке, пока страница
  // входа ещё на экране.
  useEffect(() => {
    if (sessionStatus !== "authenticated" || redirected.current) return;
    redirected.current = true;
    router.replace("/reading");
    router.refresh();
  }, [sessionStatus, router]);

  function handleAuth(widgetData: string) {
    setStatus("signing-in");
    setPrivacyConsent("accepted");
    signIn("telegram-widget", { widgetData, ref: getRememberedReferral() ?? "", redirect: false })
      .then((result) => {
        if (result?.error) setStatus("error");
      })
      .catch(() => setStatus("error"));
  }

  if (!botUsername) return null;

  return (
    <div className="space-y-4">
      {consent !== "accepted" && <ConsentCheckbox id="accept-privacy-telegram" checked={ticked} onChange={setTicked} />}
      {consentGiven ? (
        <TelegramWidget botUsername={botUsername} onAuth={handleAuth} />
      ) : (
        <p className="text-xs text-silver-500">{t.auth.telegramConsentFirst}</p>
      )}
      {consentGiven && <p className="text-center text-xs text-silver-500">{t.auth.telegramConfirmHint}</p>}
      {status === "signing-in" && <p className="text-center text-xs text-silver-400">{t.auth.telegramSigningIn}</p>}
      {status === "error" && <p className="text-center text-xs text-red-400">{t.auth.telegramFailed}</p>}
      <a
        href={`https://t.me/${botUsername}`}
        target="_blank"
        rel="noreferrer"
        className="block text-center text-sm text-gold-300 hover:underline"
      >
        {t.auth.telegramOpenBot}
      </a>
    </div>
  );
}
