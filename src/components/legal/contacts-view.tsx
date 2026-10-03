"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { OPERATOR } from "@/lib/legal/operator";

/** Seller details, payment/delivery facts and links to the legal documents — the page payment services and consumers look for. */
export function ContactsView() {
  const t = useTranslation();
  const c = t.contactsPage;

  const rows = [
    [c.nameLabel, OPERATOR.name],
    [c.statusLabel, c.sellerStatus],
    [c.innLabel, OPERATOR.registration.replace(/^ИНН\s*/i, "")],
    [c.emailLabel, OPERATOR.email],
    ...(OPERATOR.phone ? [[c.phoneLabel, OPERATOR.phone]] : []),
    ...(OPERATOR.address ? [[c.addressLabel, OPERATOR.address]] : []),
  ];

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-3xl text-silver-50 sm:text-4xl">{c.title}</h1>
      <p className="mt-3 text-sm text-silver-400">{c.intro}</p>

      <section className="mt-10">
        <h2 className="font-display text-xl text-silver-100">{c.sellerHeading}</h2>
        <dl className="mt-3 divide-y divide-white/5 rounded-xl border border-white/10 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:gap-6">
              <dt className="w-44 shrink-0 text-silver-500">{label}</dt>
              <dd className="text-silver-200">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-9">
        <h2 className="font-display text-xl text-silver-100">{c.paymentHeading}</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-silver-300">
          {c.paymentPoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>

      <section className="mt-9">
        <h2 className="font-display text-xl text-silver-100">{c.documentsHeading}</h2>
        <ul className="mt-3 space-y-1.5 text-sm">
          {[
            ["/offer", t.legal.offerLink],
            ["/privacy", t.legal.policyLink],
            ["/consent", t.legal.consentLink],
            ["/pricing", t.footer.groups.product.pricing],
          ].map(([href, label]) => (
            <li key={href}>
              <Link href={href} className="text-gold-300 underline-offset-2 hover:underline">
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
