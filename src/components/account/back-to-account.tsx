"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

/** Ссылка «назад в личный кабинет» для серверных страниц, которым самим переводы недоступны. */
export function BackToAccount({ tab = "overview" }: { tab?: "overview" | "history" | "favorites" }) {
  const t = useTranslation();
  return (
    <Link href={tab === "overview" ? "/account" : `/account?tab=${tab}`} className="text-sm text-gold-300 hover:underline">
      {t.accountPage.backToAccount}
    </Link>
  );
}
