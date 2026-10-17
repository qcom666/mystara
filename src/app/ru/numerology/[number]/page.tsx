import type { Metadata } from "next";
import { localizedMetadata } from "@/lib/seo/page-metadata";
import { getLifePathMeaning, LIFE_PATH_MEANINGS } from "@/modules/numerology/domain/life-path-meanings.data";
import type { LifePathNumber } from "@/modules/numerology/domain/types";

export { default } from "@/app/numerology/[number]/page";

interface PageProps {
  params: Promise<{ number: string }>;
}

const VALID_NUMBERS = Object.keys(LIFE_PATH_MEANINGS).map(Number);

export function generateStaticParams() {
  return VALID_NUMBERS.map((number) => ({ number: String(number) }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const number = Number((await params).number);
  if (!VALID_NUMBERS.includes(number)) return {};
  const meaning = getLifePathMeaning(number as LifePathNumber, "ru");
  return localizedMetadata({
    path: `/numerology/${meaning.number}`,
    locale: "ru",
    title: `Число жизненного пути ${meaning.number} — ${meaning.title}`,
    description: meaning.description,
  });
}
