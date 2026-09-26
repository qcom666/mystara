"use client";

import { BookOpen, Layers, Sparkles } from "lucide-react";
import Link from "next/link";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useTranslation } from "@/lib/i18n";

export function TarotHubContent() {
  const t = useTranslation();

  const sections = [
    { href: "/tarot/cards", title: t.footer.groups.learn.cardMeanings, description: t.tarotHubPage.cardMeaningsDescription, icon: Sparkles },
    { href: "/tarot/spreads", title: t.footer.groups.product.spreads, description: t.tarotHubPage.spreadsDescription, icon: Layers },
    { href: "/tarot/how-to-read-tarot", title: t.footer.groups.learn.howToRead, description: t.tarotHubPage.howToReadDescription, icon: BookOpen },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="font-display text-3xl text-silver-50 sm:text-4xl">{t.nav.learn}</h1>
      <p className="mt-3 max-w-2xl text-silver-400">{t.tarotHubPage.subtitle}</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {sections.map(({ href, title, description, icon: Icon }) => (
          <Link key={href} href={href}>
            <GlassPanel className="h-full transition-colors hover:border-gold-400/40">
              <Icon className="h-6 w-6 text-gold-400" />
              <h2 className="mt-3 font-display text-xl text-silver-100">{title}</h2>
              <p className="mt-1 text-sm text-silver-400">{description}</p>
            </GlassPanel>
          </Link>
        ))}
      </div>
    </div>
  );
}
