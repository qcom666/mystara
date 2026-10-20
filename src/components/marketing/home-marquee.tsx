"use client";

import { MarqueeBand } from "@/components/motion/effects";
import { useTranslation } from "@/lib/i18n";

/** Бегущая строка разделов между первым экраном и остальной главной. */
export function HomeMarquee() {
  const t = useTranslation();
  return <MarqueeBand items={t.marketing.marquee} />;
}
