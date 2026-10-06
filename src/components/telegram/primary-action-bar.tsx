"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTelegram } from "./telegram-provider";

/**
 * The screen's main action(s). On the website it is just a wrapper around the
 * in-page button(s), exactly as before. Inside the Telegram Mini App the same
 * buttons are lifted into a bar pinned to the bottom of the screen, so the main
 * action is always within reach — styled like the site (the gold `Button` on a
 * dark glass bar), not Telegram's native blue MainButton.
 *
 * Rendered through a portal into <body>: `position: fixed` is relative to the
 * nearest ancestor with a transform / backdrop-filter (the glass panels and the
 * animated step wrappers have both), which would otherwise pin the bar to the
 * panel instead of the screen. A submit button that lives in the bar is no
 * longer inside its <form> in the DOM, so such buttons must name their form with
 * the `form` attribute.
 */
export function PrimaryActionBar({ children, className }: { children: ReactNode; className?: string }) {
  const { isTelegram } = useTelegram();

  // Keep the last bit of page content from hiding behind the bar.
  useEffect(() => {
    if (!isTelegram) return;
    const previous = document.body.style.paddingBottom;
    document.body.style.paddingBottom = "calc(6rem + env(safe-area-inset-bottom))";
    return () => {
      document.body.style.paddingBottom = previous;
    };
  }, [isTelegram]);

  if (!isTelegram) return <div className={className}>{children}</div>;

  return createPortal(
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gold-500/15 bg-midnight-950/90 px-4 pt-3 backdrop-blur-xl"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-md flex-col gap-2 [&>*]:w-full">{children}</div>
    </div>,
    document.body,
  );
}
