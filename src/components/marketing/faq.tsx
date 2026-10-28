"use client";

import { useTranslation } from "@/lib/i18n";
import { RevealGroup, RevealItem, SectionHeading } from "@/components/motion/reveal";

export function FAQ() {
  const t = useTranslation();

  return (
    <section className="cv-auto px-4 py-20">
      <div className="mx-auto max-w-2xl">
        <SectionHeading eyebrow={t.marketing.faq.eyebrow} title={t.marketing.faq.title} />
        <RevealGroup className="mt-10 space-y-3" stagger={0.08} delay={0.15}>
          {t.marketing.faq.items.map((faq) => (
            <RevealItem key={faq.q}>
            <details className="glass-panel group rounded-2xl p-5 transition-colors duration-300 hover:border-gold-400/30">
              <summary className="focus-ring cursor-pointer list-none font-display text-lg text-silver-100 marker:content-none">
                <span className="flex items-center justify-between gap-4">
                  {faq.q}
                  <span className="shrink-0 text-gold-400 transition-transform group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-silver-400">{faq.a}</p>
            </details>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
