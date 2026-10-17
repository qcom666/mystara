import type { Metadata } from "next";
import { localizedMetadata } from "@/lib/seo/page-metadata";
import type { ZodiacSignId } from "@/modules/astrology/domain/types";
import { getAllZodiacSigns, getZodiacSignById } from "@/modules/astrology/domain/zodiac-signs.data";

export { default } from "@/app/astrology/[sign]/page";

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
    path: `/astrology/${sign.id}`,
    locale: "ru",
    title: `${sign.nameRu} — знак зодиака: характеристика`,
    description: sign.descriptionRu,
  });
}
