"use client";

import { useLocale, useTranslation } from "@/lib/i18n";
import { CONSENT_SECTIONS } from "@/lib/legal/consent";
import { hasUnfilledOperatorDetails, PRIVACY_POLICY_EFFECTIVE_DATE, PRIVACY_POLICY_VERSION } from "@/lib/legal/operator";
import { PRIVACY_POLICY_SECTIONS, type LegalSection } from "@/lib/legal/privacy-policy";

const DOCUMENTS: Record<"privacy" | "consent", LegalSection[]> = {
  privacy: PRIVACY_POLICY_SECTIONS,
  consent: CONSENT_SECTIONS,
};

/**
 * Renders a legal document in the active language. Russian is authoritative:
 * an English reader gets the English text plus a note saying so.
 */
export function LegalDocumentView({ kind }: { kind: "privacy" | "consent" }) {
  const t = useTranslation();
  const { locale } = useLocale();
  const sections = DOCUMENTS[kind];
  const title = kind === "privacy" ? t.legal.policyTitle : t.legal.consentTitle;
  const showDevWarning = process.env.NODE_ENV !== "production" && hasUnfilledOperatorDetails();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-3xl text-silver-50 sm:text-4xl">{title}</h1>
      <p className="mt-2 text-xs text-silver-500">
        {t.legal.inForceSince} {PRIVACY_POLICY_EFFECTIVE_DATE[locale]} · {t.legal.versionLabel} {PRIVACY_POLICY_VERSION}
      </p>
      {locale === "en" && <p className="mt-3 rounded-xl border border-gold-500/25 bg-gold-500/5 p-3 text-xs text-gold-300">{t.legal.translationNote}</p>}
      {showDevWarning && <p className="mt-3 rounded-xl border border-red-400/30 bg-red-400/5 p-3 text-xs text-red-300">{t.legal.unfilledWarning}</p>}

      <div className="mt-10 space-y-9">
        {sections.map((section) => (
          <section key={section.id} id={section.id}>
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
