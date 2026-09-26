"use client";

import { useEffect, useRef } from "react";
import { useTelegram } from "./telegram-provider";

interface UseTelegramMainButtonOptions {
  text: string;
  onClick: () => void;
  visible?: boolean;
  disabled?: boolean;
}

/**
 * Drives Telegram's native MainButton (the persistent bottom bar) when
 * running inside the Mini App. Callers still render their own in-page
 * button for the regular-browser case, guarded by the returned `isTelegram`
 * flag — see PROJECT_ARCHITECTURE.md §16. Telegram only has one MainButton
 * slot, so a step with more than one possible primary action (e.g. reveal
 * vs. continue) should pass whichever is currently the salient one.
 */
export function useTelegramMainButton({ text, onClick, visible = true, disabled = false }: UseTelegramMainButtonOptions): boolean {
  const { webApp, isTelegram } = useTelegram();
  const onClickRef = useRef(onClick);

  // Keep the ref in sync with the latest callback from inside an effect
  // (not during render) — the standard "latest ref" pattern, so the
  // separate effect below can call a stable handler without needing
  // `onClick` itself in its dependency array.
  useEffect(() => {
    onClickRef.current = onClick;
  });

  useEffect(() => {
    if (!isTelegram || !webApp) return;
    const button = webApp.MainButton;

    function handleClick() {
      onClickRef.current();
    }

    button.setText(text);
    button.onClick(handleClick);

    if (visible) {
      button.show();
      if (disabled) button.disable();
      else button.enable();
    } else {
      button.hide();
    }

    return () => {
      button.offClick(handleClick);
      button.hide();
    };
  }, [isTelegram, webApp, text, visible, disabled]);

  return isTelegram;
}
