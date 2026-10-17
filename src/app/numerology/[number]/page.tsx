import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LifePathNumberView } from "@/components/numerology/life-path-number-view";
import { getLifePathMeaning, LIFE_PATH_MEANINGS } from "@/modules/numerology/domain/life-path-meanings.data";
import type { LifePathNumber } from "@/modules/numerology/domain/types";
import { languageAlternates } from "@/lib/i18n/localized-routes";

interface PageProps {
  params: Promise<{ number: string }>;
}

const VALID_NUMBERS = Object.keys(LIFE_PATH_MEANINGS).map(Number);

export function generateStaticParams() {
  return VALID_NUMBERS.map((number) => ({ number: String(number) }));
}

function parseNumber(param: string): LifePathNumber | undefined {
  const number = Number(param);
  return VALID_NUMBERS.includes(number) ? (number as LifePathNumber) : undefined;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { number } = await params;
  const parsed = parseNumber(number);
  if (!parsed) return {};
  const meaning = getLifePathMeaning(parsed);
  return {
    title: `Life Path Number ${meaning.number} — ${meaning.title}`,
    description: meaning.description,
    alternates: languageAlternates(`/numerology/${meaning.number}`, "en"),
  };
}

export default async function LifePathNumberPage({ params }: PageProps) {
  const { number } = await params;
  const parsed = parseNumber(number);
  if (!parsed) notFound();

  return <LifePathNumberView number={parsed} />;
}
