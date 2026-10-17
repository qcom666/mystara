"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { stripLocalePrefix } from "@/lib/i18n/localized-routes";
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

    // Главный экран и его русская версия (/ru).
    if (stripLocalePrefix(pathname) === "/") {
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
