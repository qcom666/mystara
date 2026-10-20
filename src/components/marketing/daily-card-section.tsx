"use client";

import { SectionHeading } from "@/components/motion/reveal";
import { DailyCardRitual } from "@/components/tarot/daily-card-content";
import { useTranslation } from "@/lib/i18n";

/** Карта дня прямо на главной: тот же ритуал, что на отдельной странице, но коротко и со ссылкой на полное толкование. */
export function DailyCardSection() {
  const t = useTranslation();
  return (
    <section id="card-of-the-day" className="overflow-x-clip px-4 py-24">
      <DailyCardRitual
        variant="home"
        header={<SectionHeading eyebrow={t.marketing.dailyCard.eyebrow} title={t.marketing.dailyCard.title} subtitle={t.marketing.dailyCard.subtitle} />}
      />
    </section>
  );
}
