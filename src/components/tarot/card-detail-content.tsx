"use client";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocale, useTranslation } from "@/lib/i18n";
import { getCardDescription, getCardKeywords, getCardMeanings, getCardName } from "@/modules/tarot/domain/deck";
import type { Orientation, TarotCard } from "@/modules/tarot/domain/types";
import { TarotCardFace } from "./tarot-card-face";

interface CardDetailContentProps {
  card: TarotCard;
  orientation?: Orientation;
}

export function CardDetailContent({ card, orientation }: CardDetailContentProps) {
  const t = useTranslation();
  const { locale } = useLocale();
  const meanings = getCardMeanings(card, locale);

  return (
    <div className="space-y-5">
      <div className="flex gap-4">
        <div className="w-24 shrink-0 sm:w-28">
          <TarotCardFace card={card} orientation={orientation} locale={locale} className="card-glow w-full" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-silver-500">
            {card.arcana === "major" ? t.reading.majorArcana : card.suit ? t.reading.suits[card.suit] : ""}
          </p>
          <h3 className="font-display text-2xl text-silver-100">{getCardName(card, locale)}</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {getCardKeywords(card, locale).map((keyword) => (
              <Badge key={keyword} variant="outline">
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <p className="text-sm italic text-silver-400">{getCardDescription(card, locale)}</p>

      <p className="text-sm text-silver-300">
        <span className="text-silver-500">{t.reading.yesNoLabel}: </span>
        {t.reading.yesNoAnswers[meanings.yesNo]}
      </p>

      <Tabs defaultValue={orientation === "reversed" ? "reversed" : "upright"}>
        <TabsList>
          <TabsTrigger value="upright">{t.reading.upright}</TabsTrigger>
          <TabsTrigger value="reversed">{t.reading.reversed}</TabsTrigger>
          <TabsTrigger value="love">{t.reading.loveTab}</TabsTrigger>
          <TabsTrigger value="career">{t.reading.careerTab}</TabsTrigger>
          <TabsTrigger value="finance">{t.reading.financeTab}</TabsTrigger>
          <TabsTrigger value="spiritual">{t.reading.spiritualTab}</TabsTrigger>
        </TabsList>
        <TabsContent value="upright">
          <p className="text-sm leading-relaxed text-silver-300">{meanings.upright}</p>
        </TabsContent>
        <TabsContent value="reversed">
          <p className="text-sm leading-relaxed text-silver-300">{meanings.reversed}</p>
        </TabsContent>
        <TabsContent value="love">
          <p className="text-sm leading-relaxed text-silver-300">{meanings.love}</p>
        </TabsContent>
        <TabsContent value="career">
          <p className="text-sm leading-relaxed text-silver-300">{meanings.career}</p>
        </TabsContent>
        <TabsContent value="finance">
          <p className="text-sm leading-relaxed text-silver-300">{meanings.finance}</p>
        </TabsContent>
        <TabsContent value="spiritual">
          <p className="text-sm leading-relaxed text-silver-300">{meanings.spiritual}</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
