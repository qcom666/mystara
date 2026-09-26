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
  /** True only once we've confirmed we're actually running inside a Telegram client, not a regular browser. */
  isTelegram: boolean;
}

const TelegramContext = createContext<TelegramContextValue>({ webApp: null, isTelegram: false });

export function useTelegram(): TelegramContextValue {
  return useContext(TelegramContext);
}

/**
 * Loads the Telegram WebApp SDK, initializes it (ready/expand/theme), and —
 * when running inside Telegram — signs the user in automatically via the
 * "telegram" Credentials provider (src/lib/auth.ts), using the initData
 * Telegram itself already signed. Outside Telegram (a regular browser),
 * `webApp` stays null and nothing else changes — the app works exactly as
 * before via email/Google sign-in.
 */
export function TelegramProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const consent = usePrivacyConsent();
  // Lazy initializer: covers the case where the script (and window.Telegram)
  // was already loaded/cached by the time this provider first mounted.
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(() => getTelegramWebApp());
  const hasAttemptedSignIn = useRef(false);

  function handleScriptLoad() {
    const app = getTelegramWebApp();
    if (app) setWebApp(app);
  }

  // Pure "synchronize with an external system" effect — no setState here.
  // Runs whenever `webApp` first becomes available, regardless of whether
  // that happened via the lazy initializer above or the script's onLoad.
  useEffect(() => {
    if (!webApp) return;
    webApp.ready();
    webApp.expand();
    // Keep Telegram's own header/background chrome in our brand color
    // instead of its default, so there's no visible seam around the app.
    try {
      webApp.setHeaderColor("#05040a");
      webApp.setBackgroundColor("#05040a");
    } catch {
      // Older Telegram clients may not support these calls — non-fatal.
    }
  }, [webApp]);

  // Signing in creates an account from the Telegram profile, so it waits for the
  // user's consent (see TelegramConsentGate). Declining leaves them a guest.
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
