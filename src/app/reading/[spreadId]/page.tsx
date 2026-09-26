import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PremiumLockedView } from "@/components/reading/premium-locked-view";
import { ReadingFlow } from "@/components/reading/reading-flow";
import { auth } from "@/lib/auth";
import { getAllSpreads, getSpreadById } from "@/modules/tarot/domain/spreads.data";

interface PageProps {
  params: Promise<{ spreadId: string }>;
}

export function generateStaticParams() {
  return getAllSpreads().map((spread) => ({ spreadId: spread.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { spreadId } = await params;
  const spread = getSpreadById(spreadId);
  if (!spread) return {};
  return {
    title: `${spread.name} Reading`,
    description: spread.description,
  };
}

export default async function ReadingSpreadPage({ params }: PageProps) {
  const { spreadId } = await params;
  const spread = getSpreadById(spreadId);
  if (!spread) notFound();

  const session = await auth().catch(() => null);
  const planTier = session?.user?.planTier ?? "free";

  if (spread.isPremium && planTier !== "premium") {
    return <PremiumLockedView spread={spread} />;
  }

  return <ReadingFlow spread={spread} isAuthenticated={Boolean(session?.user?.id)} />;
}
