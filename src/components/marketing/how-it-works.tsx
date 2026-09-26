"use client";

import { MessageCircleQuestion, Shuffle, Sparkles, Wand2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const STEP_ICONS = [Wand2, MessageCircleQuestion, Shuffle, Sparkles] as const;

export function HowItWorks() {
  const t = useTranslation();

  return (
    <section id="how-it-works" className="px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-gold-400">{t.marketing.howItWorks.eyebrow}</p>
          <h2 className="mt-3 font-display text-3xl text-silver-50">{t.marketing.howItWorks.title}</h2>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {t.marketing.howItWorks.steps.map((step, index) => {
            const Icon = STEP_ICONS[index];
            return (
              <div key={step.title} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold-500/30 bg-gold-500/10">
                  <Icon className="h-6 w-6 text-gold-400" />
                </div>
                <p className="mt-4 text-xs text-silver-500">
                  {t.marketing.howItWorks.stepLabel} {index + 1}
                </p>
                <h3 className="mt-1 font-display text-lg text-silver-100">{step.title}</h3>
                <p className="mt-1 text-sm text-silver-400">{step.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
