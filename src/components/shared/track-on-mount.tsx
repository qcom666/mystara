"use client";

import { useEffect, useRef } from "react";
import { type AnalyticsEvent, track } from "@/lib/analytics";

/** Отправляет событие один раз при показе страницы (например, просмотр главной). */
export function TrackOnMount({ event }: { event: AnalyticsEvent }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    track(event);
  }, [event]);
  return null;
}
