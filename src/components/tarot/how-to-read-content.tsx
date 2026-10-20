"use client";

import Link from "@/components/shared/localized-link";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useTranslation } from "@/lib/i18n";
import { SplitWords } from "@/components/motion/reveal";

export function HowToReadContent() {
  const t = useTranslation();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="font-display text-3xl text-silver-50 sm:text-4xl"><SplitWords text={t.footer.groups.learn.howToRead} immediate delay={0.1} /></h1>
      <p className="mt-3 text-silver-400">{t.howToReadPage.subtitle}</p>

      <div className="mt-10 space-y-5">
        {t.howToReadPage.steps.map((step) => (
          <GlassPanel key={step.title}>
            <h2 className="font-display text-xl text-gold-300">{step.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-silver-300">{step.body}</p>
          </GlassPanel>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-silver-500">{t.howToReadPage.disclaimer}</p>

      <div className="mt-8 text-center">
        <Button asChild size="lg">
          <Link href="/reading">{t.howToReadPage.ctaButton}</Link>
        </Button>
      </div>
    </div>
  );
}
