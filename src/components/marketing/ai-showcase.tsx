"use client";

import { Sparkles } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useTranslation } from "@/lib/i18n";

export function AIShowcase() {
  const t = useTranslation();

  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-gold-400">{t.marketing.aiShowcase.eyebrow}</p>
          <h2 className="mt-3 font-display text-3xl text-silver-50">{t.marketing.aiShowcase.title}</h2>
          <p className="mx-auto mt-2 max-w-xl text-silver-400">{t.marketing.aiShowcase.body}</p>
        </div>

        <GlassPanel className="mt-10">
          <div className="flex items-center gap-2 text-gold-300">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">{t.marketing.aiShowcase.exampleLabel}</span>
          </div>
          <p className="mt-3 text-sm italic text-silver-400">{t.marketing.aiShowcase.exampleQuestion}</p>
          <p className="mt-3 text-sm leading-relaxed text-silver-300">{t.marketing.aiShowcase.exampleBody}</p>
        </GlassPanel>
      </div>
    </section>
  );
}
