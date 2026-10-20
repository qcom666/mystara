"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId, useState } from "react";
import { CardFlipIn } from "@/components/motion/effects";
import { EASE_OUT } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocale, useTranslation } from "@/lib/i18n";
import { getCardDescription, getCardKeywords, getCardMeanings, getCardName } from "@/modules/tarot/domain/deck";
import type { Orientation, TarotCard } from "@/modules/tarot/domain/types";
import { HoloCard } from "./holo-card";
import { TarotCardFace } from "./tarot-card-face";

interface CardDetailContentProps {
  card: TarotCard;
  orientation?: Orientation;
}

type MeaningTab = "upright" | "reversed" | "love" | "career" | "finance" | "spiritual";

/**
 * «Да/нет» и вкладки значений. Под активной вкладкой плавно переезжает золотая подложка, а текст новой
 * вкладки проявляется из лёгкого размытия.
 */
export function CardMeaningTabs({ card, orientation }: CardDetailContentProps) {
  const t = useTranslation();
  const { locale } = useLocale();
  const reduceMotion = useReducedMotion();
  const meanings = getCardMeanings(card, locale);
  const [tab, setTab] = useState<MeaningTab>(orientation === "reversed" ? "reversed" : "upright");
  // У каждого набора вкладок своя подложка: на странице и в окне расклада они не должны перетекать друг в друга.
  const pillId = useId();

  const tabs: { value: MeaningTab; label: string; text: string }[] = [
    { value: "upright", label: t.reading.upright, text: meanings.upright },
    { value: "reversed", label: t.reading.reversed, text: meanings.reversed },
    { value: "love", label: t.reading.loveTab, text: meanings.love },
    { value: "career", label: t.reading.careerTab, text: meanings.career },
    { value: "finance", label: t.reading.financeTab, text: meanings.finance },
    { value: "spiritual", label: t.reading.spiritualTab, text: meanings.spiritual },
  ];

  return (
    <div className="space-y-5">
      <p className="text-sm text-silver-300">
        <span className="text-silver-500">{t.reading.yesNoLabel}: </span>
        {t.reading.yesNoAnswers[meanings.yesNo]}
      </p>

      <Tabs value={tab} onValueChange={(value) => setTab(value as MeaningTab)}>
        <TabsList>
          {tabs.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              className="relative isolate data-[state=active]:bg-none"
            >
              {tab === item.value && (
                <motion.span
                  layoutId={`meaning-tab-${pillId}`}
                  className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 shadow-[0_0_18px_-4px_rgba(212,175,55,0.7)]"
                  transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((item) => (
          <TabsContent key={item.value} value={item.value}>
            <motion.p
              className="text-sm leading-relaxed text-silver-300"
              initial={reduceMotion ? false : { opacity: 0, y: 8, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.45, ease: EASE_OUT }}
            >
              {item.text}
            </motion.p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

/** Карта целиком в компактном виде: окно с подробностями карты в раскладе. */
export function CardDetailContent({ card, orientation }: CardDetailContentProps) {
  const t = useTranslation();
  const { locale } = useLocale();

  return (
    <div className="space-y-5">
      <div className="flex gap-4">
        <CardFlipIn className="w-24 shrink-0 sm:w-28">
          <HoloCard>
            <TarotCardFace card={card} orientation={orientation} locale={locale} className="card-glow w-full" />
          </HoloCard>
        </CardFlipIn>
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

      <CardMeaningTabs card={card} orientation={orientation} />
    </div>
  );
}
