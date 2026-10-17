import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HoroscopeSignView } from "@/components/astrology/horoscope-view";
import type { ZodiacSignId } from "@/modules/astrology/domain/types";
import { getAllZodiacSigns, getZodiacSignById } from "@/modules/astrology/domain/zodiac-signs.data";
import { buildDailyHoroscope } from "@/modules/astrology/services/daily-horoscope";
import { getSkyOfDay } from "@/modules/astrology/services/sky-of-day";
import { moscowDay } from "@/modules/tarot/services/daily-card";

// Гороскоп меняется в полночь по Москве: страница пересобирается не реже раза в 10 минут.
export const revalidate = 600;

interface PageProps {
  params: Promise<{ sign: string }>;
}

export function generateStaticParams() {
  return getAllZodiacSigns().map((sign) => ({ sign: sign.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sign: signId } = await params;
  const sign = getZodiacSignById(signId as ZodiacSignId);
  if (!sign) return {};
  return {
    title: `${sign.name} Horoscope for Today`,
    description: `Today's horoscope for ${sign.name}: love, work and energy, based on the real position of the Moon.`,
  };
}

export default async function SignHoroscopePage({ params }: PageProps) {
  const { sign: signId } = await params;
  const sign = getZodiacSignById(signId as ZodiacSignId);
  if (!sign) notFound();
  const sky = getSkyOfDay(moscowDay());
  return <HoroscopeSignView sky={sky} horoscope={buildDailyHoroscope(sign.id, sky)} />;
}
