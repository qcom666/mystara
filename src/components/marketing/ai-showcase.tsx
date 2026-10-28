"use client";

import { Sparkles } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useTranslation } from "@/lib/i18n";
import { Reveal, SectionHeading } from "@/components/motion/reveal";
import { Typewriter } from "@/components/motion/typewriter";

export function AIShowcase() {
  const t = useTranslation();

  return (
    <section className="cv-auto px-4 py-20">
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow={t.marketing.aiShowcase.eyebrow} title={t.marketing.aiShowcase.title} subtitle={t.marketing.aiShowcase.body} />

        <Reveal delay={0.15} y={40}>
          <GlassPanel className="mt-10">
            <div className="flex items-center gap-2 text-gold-300">
              <Sparkles className="h-4 w-4 motion-safe:animate-pulse" />
              <span className="text-xs uppercase tracking-wide">{t.marketing.aiShowcase.exampleLabel}</span>
            </div>
            <p className="mt-3 text-sm italic text-silver-400">{t.marketing.aiShowcase.exampleQuestion}</p>
            <p className="mt-3 text-sm leading-relaxed text-silver-300">
              <Typewriter text={t.marketing.aiShowcase.exampleBody} />
            </p>
          </GlassPanel>
        </Reveal>
      </div>
    </section>
  );
}
