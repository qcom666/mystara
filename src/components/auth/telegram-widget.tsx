"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "@/lib/i18n";

declare global {
  interface Window {
    onMystaraTelegramAuth?: (user: Record<string, unknown>) => void;
  }
}

/** Ответ виджета, приведённый к строкам: подпись Telegram считается по строковому виду полей. */
export function widgetPayloadToJson(user: Record<string, unknown>): string {
  return JSON.stringify(Object.fromEntries(Object.entries(user).map(([key, value]) => [key, String(value)])));
}

interface TelegramWidgetProps {
  /** Имя бота без @. Домен сайта должен быть привязан к боту через /setdomain в @BotFather. */
  botUsername: string;
  /** Вызывается, когда пользователь подтвердил вход в Telegram; данные подписаны Telegram. */
  onAuth: (widgetData: string) => void;
}

/** Официальная кнопка «Войти через Telegram»: подключает скрипт Telegram и передаёт подписанный ответ. */
export function TelegramWidget({ botUsername, onAuth }: TelegramWidgetProps) {
  const { locale } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  // Свежий обработчик без пересоздания кнопки при каждой перерисовке родителя.
  const onAuthRef = useRef(onAuth);

  useEffect(() => {
    onAuthRef.current = onAuth;
  }, [onAuth]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !botUsername) return;

    window.onMystaraTelegramAuth = (user) => onAuthRef.current(widgetPayloadToJson(user));

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
  }, [botUsername, locale]);

  return <div ref={containerRef} className="flex min-h-[44px] justify-center" />;
}
