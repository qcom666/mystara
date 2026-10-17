import type { Metadata } from "next";
import { localizedMetadata } from "@/lib/seo/page-metadata";
import type { ZodiacSignId } from "@/modules/astrology/domain/types";
import { getAllZodiacSigns, getZodiacSignById } from "@/modules/astrology/domain/zodiac-signs.data";

export { default } from "@/app/astrology/horoscope/[sign]/page";

// Как и у английской версии: гороскоп меняется в полночь по Москве.
export const revalidate = 600;

interface PageProps {
  params: Promise<{ sign: string }>;
}

export function generateStaticParams() {
  return getAllZodiacSigns().map((sign) => ({ sign: sign.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const sign = getZodiacSignById((await params).sign as ZodiacSignId);
  if (!sign) return {};
  return localizedMetadata({
    path: `/astrology/horoscope/${sign.id}`,
    locale: "ru",
    title: `Гороскоп на сегодня: ${sign.nameRu}`,
    description: `Гороскоп на сегодня для знака ${sign.nameRu}: любовь, дела и энергия по настоящему положению Луны.`,
  });
}
