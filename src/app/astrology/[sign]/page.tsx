import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ZodiacSignView } from "@/components/astrology/zodiac-sign-view";
import type { ZodiacSignId } from "@/modules/astrology/domain/types";
import { getAllZodiacSigns, getZodiacSignById } from "@/modules/astrology/domain/zodiac-signs.data";

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
    title: `${sign.name} — Zodiac Sign Meaning`,
    description: sign.description,
  };
}

export default async function ZodiacSignPage({ params }: PageProps) {
  const { sign: signId } = await params;
  const sign = getZodiacSignById(signId as ZodiacSignId);
  if (!sign) notFound();

  return <ZodiacSignView sign={sign} />;
}
