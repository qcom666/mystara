"use client";

import { useTranslation } from "@/lib/i18n";

export function FAQ() {
  const t = useTranslation();

  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-gold-400">{t.marketing.faq.eyebrow}</p>
          <h2 className="mt-3 font-display text-3xl text-silver-50">{t.marketing.faq.title}</h2>
        </div>
        <div className="mt-10 space-y-3">
          {t.marketing.faq.items.map((faq) => (
            <details key={faq.q} className="glass-panel group rounded-2xl p-5">
              <summary className="focus-ring cursor-pointer list-none font-display text-lg text-silver-100 marker:content-none">
                <span className="flex items-center justify-between gap-4">
                  {faq.q}
                  <span className="shrink-0 text-gold-400 transition-transform group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-silver-400">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
