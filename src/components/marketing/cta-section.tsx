"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

export function CTASection() {
  const t = useTranslation();

  return (
    <section className="px-4 py-24">
      <div className="glass-panel card-glow noise-overlay relative mx-auto max-w-3xl rounded-3xl p-10 text-center sm:p-14">
        <h2 className="font-display text-3xl text-silver-50 sm:text-4xl">{t.marketing.cta.title}</h2>
        <p className="mx-auto mt-3 max-w-lg text-silver-400">{t.marketing.cta.subtitle}</p>
        <Button size="lg" className="mt-8" asChild>
          <Link href="/reading">{t.landing.ctaPrimary}</Link>
        </Button>
      </div>
    </section>
  );
}
