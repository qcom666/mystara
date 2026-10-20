"use client";

import { useLocale, useTranslation } from "@/lib/i18n";
import { CONSENT_SECTIONS } from "@/lib/legal/consent";
import { OFFER_SECTIONS } from "@/lib/legal/offer";
import {
  hasUnfilledOperatorDetails,
  OFFER_EFFECTIVE_DATE,
  OFFER_VERSION,
  PRIVACY_POLICY_EFFECTIVE_DATE,
  PRIVACY_POLICY_VERSION,
} from "@/lib/legal/operator";
import { PRIVACY_POLICY_SECTIONS, type LegalSection } from "@/lib/legal/privacy-policy";
import { SplitWords } from "@/components/motion/reveal";

type DocumentKind = "privacy" | "consent" | "offer";

const DOCUMENTS: Record<DocumentKind, LegalSection[]> = {
  privacy: PRIVACY_POLICY_SECTIONS,
  consent: CONSENT_SECTIONS,
  offer: OFFER_SECTIONS,
};

/**
 * Показывает юридический документ на выбранном языке. Основной текст русский: англоязычный
 * читатель видит английский текст и пометку об этом.
 */
export function LegalDocumentView({ kind }: { kind: DocumentKind }) {
  const t = useTranslation();
  const { locale } = useLocale();
  const sections = DOCUMENTS[kind];
  const title = { privacy: t.legal.policyTitle, consent: t.legal.consentTitle, offer: t.legal.offerTitle }[kind];
  const effectiveDate = kind === "offer" ? OFFER_EFFECTIVE_DATE : PRIVACY_POLICY_EFFECTIVE_DATE;
  const version = kind === "offer" ? OFFER_VERSION : PRIVACY_POLICY_VERSION;
  const showDevWarning = process.env.NODE_ENV !== "production" && hasUnfilledOperatorDetails();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-3xl text-silver-50 sm:text-4xl"><SplitWords text={title} immediate delay={0.1} /></h1>
      <p className="mt-2 text-xs text-silver-500">
        {t.legal.inForceSince} {effectiveDate[locale]} · {t.legal.versionLabel} {version}
      </p>
      {locale === "en" && <p className="mt-3 rounded-xl border border-gold-500/25 bg-gold-500/5 p-3 text-xs text-gold-300">{t.legal.translationNote}</p>}
      {showDevWarning && <p className="mt-3 rounded-xl border border-red-400/30 bg-red-400/5 p-3 text-xs text-red-300">{t.legal.unfilledWarning}</p>}

      <div className="mt-10 space-y-9">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-reveal">
            <h2 className="font-display text-xl text-silver-100">{section.title[locale]}</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-silver-300">
              {section.body[locale].map((block, index) =>
                typeof block === "string" ? (
                  <p key={index}>{block}</p>
                ) : (
                  <ul key={index} className="list-disc space-y-1.5 pl-5">
                    {block.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ),
              )}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
