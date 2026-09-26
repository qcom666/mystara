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
    // Not fatal: the endpoint is idempotent, we'd just call it again next page load.
  }
}

/**
 * Bridges the device-side choice to the user's record: once someone is signed in
 * AND has accepted the current policy on this device, store that on their account.
 * Renders nothing.
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
        // Offline or transient — retried on the next page load.
      });
  }, [status, consent]);

  return null;
}
