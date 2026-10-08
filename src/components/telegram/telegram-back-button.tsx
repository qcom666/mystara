"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTelegram } from "./telegram-provider";

/**
 * Синхронизирует нативную кнопку «Назад» Telegram с роутером Next.js: на главном экране мини-приложения
 * она скрыта, на остальных видна и вызывает router.back(). Ничего не отображает: SiteHeader и SiteFooter
 * внутри Telegram и так скрыты, поэтому это единственный способ вернуться назад в таком контексте.
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
