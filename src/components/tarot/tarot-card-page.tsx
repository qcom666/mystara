import { TarotCardDetailView } from "@/components/tarot/tarot-card-detail-view";
import type { Locale } from "@/lib/i18n";
import { getCardDescription, getCardName } from "@/modules/tarot/domain/deck";
import type { TarotCard } from "@/modules/tarot/domain/types";

/** Страница карты с разметкой schema.org на языке версии (английская и русская страницы). */
export function TarotCardPage({ card, locale }: { card: TarotCard; locale: Locale }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Thing",
    name: getCardName(card, locale),
    description: getCardDescription(card, locale),
    inLanguage: locale,
  };
  return (
    <>
      <TarotCardDetailView card={card} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
