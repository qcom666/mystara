"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTelegram } from "./telegram-provider";

/**
 * Syncs Telegram's native BackButton to Next.js's router: hidden on the
 * Mini App home screen, visible (and wired to router.back()) everywhere
 * else. Renders nothing — SiteHeader/SiteFooter already stay hidden inside
 * Telegram, so this is the only back-navigation affordance in that context.
 */
export function TelegramBackButton() {
  const { webApp, isTelegram } = useTelegram();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isTelegram || !webApp) return;

    if (pathname === "/") {
      webApp.BackButton.hide();
      return;
    }

    function handleBack() {
      router.back();
    }

    webApp.BackButton.show();
    webApp.BackButton.onClick(handleBack);
    return () => {
      webApp.BackButton.offClick(handleBack);
    };
  }, [isTelegram, webApp, pathname, router]);

  return null;
}
