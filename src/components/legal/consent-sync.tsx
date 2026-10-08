"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { PRIVACY_POLICY_VERSION } from "@/lib/legal/operator";
import { usePrivacyConsent } from "@/lib/legal/use-privacy-consent";

const SYNCED_KEY = "mystara-consent-synced";

function wasSynced(): boolean {
  try {
    return window.sessionStorage.getItem(SYNCED_KEY) === PRIVACY_POLICY_VERSION;
  } catch {
    return false;
  }
}

function markSynced(): void {
  try {
    window.sessionStorage.setItem(SYNCED_KEY, PRIVACY_POLICY_VERSION);
  } catch {
    // Не критично: маршрут идемпотентный, при следующей загрузке страницы просто вызовем его снова.
  }
}

/**
 * Связывает выбор на устройстве с записью пользователя: когда человек вошёл и принял текущую
 * политику на этом устройстве, сохраняем это в его аккаунте. Ничего не отображает.
 */
export function ConsentSync() {
  const { status } = useSession();
  const consent = usePrivacyConsent();

  useEffect(() => {
    if (status !== "authenticated" || consent !== "accepted" || wasSynced()) return;
    fetch("/api/privacy/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version: PRIVACY_POLICY_VERSION }),
    })
      .then((response) => {
        if (response.ok) markSynced();
      })
      .catch(() => {
        // Нет сети или временный сбой: повторим при следующей загрузке страницы.
      });
  }, [status, consent]);

  return null;
}
