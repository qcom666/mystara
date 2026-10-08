"use client";

import type { ReactNode } from "react";
import { TelegramHome } from "./telegram-home";
import { useTelegram } from "./telegram-provider";

/** Заменяет рекламную главную страницу главным экраном мини-приложения при запуске внутри Telegram. */
export function TelegramGate({ children }: { children: ReactNode }) {
  const { isTelegram } = useTelegram();
  if (isTelegram) return <TelegramHome />;
  return <>{children}</>;
}
