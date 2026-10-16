"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ConsentCheckbox } from "@/components/legal/consent-checkbox";
import { useLocale, useTranslation } from "@/lib/i18n";
import { setPrivacyConsent, usePrivacyConsent } from "@/lib/legal/use-privacy-consent";

declare global {
  interface Window {
    onMystaraTelegramAuth?: (user: Record<string, unknown>) => void;
  }
}

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
  const { locale } = useLocale();
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const consent = usePrivacyConsent();
  const [ticked, setTicked] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const widgetRef = useRef<HTMLDivElement>(null);

  const consentGiven = consent === "accepted" || ticked;

  const redirected = useRef(false);

  // Один переход после входа: без защиты эффект срабатывал бы на каждой перерисовке, пока страница
  // входа ещё на экране.
  useEffect(() => {
    if (sessionStatus !== "authenticated" || redirected.current) return;
    redirected.current = true;
    router.replace("/reading");
    router.refresh();
  }, [sessionStatus, router]);

  useEffect(() => {
    const container = widgetRef.current;
    if (!container || !botUsername || !consentGiven) return;

    window.onMystaraTelegramAuth = (user) => {
      setStatus("signing-in");
      setPrivacyConsent("accepted");
      // Подпись Telegram считается по строковому виду полей, поэтому числа приводим к строкам.
      const widgetData = JSON.stringify(Object.fromEntries(Object.entries(user).map(([key, value]) => [key, String(value)])));
      signIn("telegram-widget", { widgetData, redirect: false })
        .then((result) => {
          if (result?.error) setStatus("error");
        })
        .catch(() => setStatus("error"));
    };

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.dataset.telegramLogin = botUsername;
    script.dataset.size = "large";
    script.dataset.radius = "12";
    script.dataset.lang = locale;
    script.dataset.onauth = "onMystaraTelegramAuth(user)";
    container.replaceChildren(script);

    return () => {
      delete window.onMystaraTelegramAuth;
      container.replaceChildren();
    };
  }, [botUsername, consentGiven, locale]);

  if (!botUsername) return null;

  return (
    <div className="space-y-4">
      {consent !== "accepted" && <ConsentCheckbox id="accept-privacy-telegram" checked={ticked} onChange={setTicked} />}
      {consentGiven ? (
        <div ref={widgetRef} className="flex min-h-[44px] justify-center" />
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
