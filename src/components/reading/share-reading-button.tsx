"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";
import { useTelegram } from "@/components/telegram/telegram-provider";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { useLocale, useTranslation } from "@/lib/i18n";
import { buildShareImagePath } from "@/lib/share/reading-share";
import type { DrawnCard } from "@/modules/tarot/domain/types";

interface ShareReadingButtonProps {
  spreadId: string;
  spreadName: string;
  cards: DrawnCard[];
}

/**
 * Поделиться раскладом картинкой: в Telegram сразу открывается редактор истории, на телефоне системное меню
 * «Поделиться» с файлом, в остальных случаях картинка открывается в новой вкладке, откуда её можно сохранить.
 * На картинке только расклад и карты: вопрос пользователя туда не попадает.
 */
export function ShareReadingButton({ spreadId, spreadName, cards }: ShareReadingButtonProps) {
  const t = useTranslation();
  const { locale } = useLocale();
  const { webApp } = useTelegram();
  const [busy, setBusy] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}${buildShareImagePath(spreadId, cards, locale, "story")}`;
    const text = `${t.reading.shareText.replace("{spread}", spreadName)} ${window.location.origin}`;

    if (webApp?.shareToStory && (webApp.isVersionAtLeast?.("7.8") ?? false)) {
      webApp.shareToStory(url, { text });
      track({ name: "reading_shared", spreadId, channel: "telegram_story" });
      return;
    }

    setBusy(true);
    try {
      if (typeof navigator.share === "function" && typeof navigator.canShare === "function") {
        const blob = await (await fetch(url)).blob();
        const file = new File([blob], "mystara-reading.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], text });
          track({ name: "reading_shared", spreadId, channel: "native_share" });
          return;
        }
      }
      window.open(url, "_blank", "noopener");
      track({ name: "reading_shared", spreadId, channel: "image" });
    } catch (error) {
      // Отмена в системном меню - не ошибка; в остальных случаях даём картинку напрямую.
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        window.alert(t.reading.shareFailed);
        window.open(url, "_blank", "noopener");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" variant="secondary" className="mt-4" disabled={busy} onClick={handleShare}>
      <Share2 className="mr-2 h-4 w-4" aria-hidden />
      {busy ? t.common.loading : t.reading.shareCta}
    </Button>
  );
}
