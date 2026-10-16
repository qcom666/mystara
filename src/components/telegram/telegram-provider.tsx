"use client";

import { signIn, useSession } from "next-auth/react";
import Script from "next/script";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { track } from "@/lib/analytics";
import { usePrivacyConsent } from "@/lib/legal/use-privacy-consent";
import type { TelegramWebApp } from "@/lib/telegram/types";
import { getTelegramWebApp } from "@/lib/telegram/webapp";

interface TelegramContextValue {
  webApp: TelegramWebApp | null;
  /** true только после того, как подтверждено, что мы запущены в клиенте Telegram, а не в обычном браузере. */
  isTelegram: boolean;
}

const TelegramContext = createContext<TelegramContextValue>({ webApp: null, isTelegram: false });

export function useTelegram(): TelegramContextValue {
  return useContext(TelegramContext);
}

/**
 * Загружает SDK Telegram WebApp, инициализирует его (ready/expand/тема) и, если мы внутри Telegram,
 * автоматически выполняет вход через провайдер Credentials «telegram» (src/lib/auth.ts), используя
 * initData, уже подписанный самим Telegram. Вне Telegram (в обычном браузере) `webApp` остаётся null
 * и ничего больше не меняется: приложение работает как обычный сайт: вход по e-mail и паролю или через виджет «Войти через Telegram».
 */
export function TelegramProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const consent = usePrivacyConsent();
  // Ленивая инициализация: на случай, если скрипт (и window.Telegram) уже загружен или взят из кэша
  // к моменту первого монтирования провайдера.
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(() => getTelegramWebApp());
  const hasAttemptedSignIn = useRef(false);

  function handleScriptLoad() {
    const app = getTelegramWebApp();
    if (app) setWebApp(app);
  }

  // Чистый эффект «синхронизации с внешней системой», без setState. Срабатывает, когда `webApp` впервые
  // становится доступен, независимо от того, произошло это через ленивую инициализацию выше или
  // через onLoad скрипта.
  useEffect(() => {
    if (!webApp) return;
    webApp.ready();
    webApp.expand();
    // Оформляем шапку и фон Telegram в цвет бренда вместо стандартных, чтобы вокруг приложения
    // не было заметного шва.
    try {
      webApp.setHeaderColor("#05040a");
      webApp.setBackgroundColor("#05040a");
    } catch {
      // Старые клиенты Telegram могут не поддерживать эти вызовы: не критично.
    }
  }, [webApp]);

  // Вход создаёт аккаунт из профиля Telegram, поэтому ждёт согласия пользователя (см. TelegramConsentGate).
  // Если он отказался, остаётся гостем.
  useEffect(() => {
    if (!webApp?.initData || status !== "unauthenticated" || consent !== "accepted" || hasAttemptedSignIn.current) return;
    hasAttemptedSignIn.current = true;
    const telegramId = webApp.initDataUnsafe.user?.id;
    signIn("telegram", { initData: webApp.initData, redirect: false })
      .then((result) => {
        if (result && !result.error && telegramId) {
          track({ name: "telegram_session_started", telegramId: String(telegramId) });
        }
      })
      .catch(() => {
        hasAttemptedSignIn.current = false;
      });
  }, [webApp, status, consent]);

  return (
    <TelegramContext.Provider value={{ webApp, isTelegram: Boolean(webApp?.initData) }}>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" onLoad={handleScriptLoad} />
      {children}
    </TelegramContext.Provider>
  );
}
