"use client";

import { useEffect } from "react";
import { rememberReferralFromUrl } from "@/lib/referral-client";

/** Запоминает код приглашения из ссылки `?ref=КОД`, чтобы передать его при создании аккаунта. */
export function ReferralCapture() {
  useEffect(() => {
    rememberReferralFromUrl();
  }, []);
  return null;
}
