"use client";

import type { ReactNode } from "react";
import { TelegramHome } from "./telegram-home";
import { useTelegram } from "./telegram-provider";

/** Swaps the marketing landing page for the Mini App home hub when running inside Telegram. */
export function TelegramGate({ children }: { children: ReactNode }) {
  const { isTelegram } = useTelegram();
  if (isTelegram) return <TelegramHome />;
  return <>{children}</>;
}
