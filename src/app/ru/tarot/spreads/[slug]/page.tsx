import type { Metadata } from "next";
import { localizedMetadata } from "@/lib/seo/page-metadata";
import { getAllSpreads, getSpreadById, getSpreadDescription, getSpreadName } from "@/modules/tarot/domain/spreads.data";

export { default } from "@/app/tarot/spreads/[slug]/page";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllSpreads().map((spread) => ({ slug: spread.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const spread = getSpreadById((await params).slug);
  if (!spread) return {};
  return localizedMetadata({
    path: `/tarot/spreads/${spread.slug}`,
    locale: "ru",
    title: `Расклад Таро «${getSpreadName(spread, "ru")}»`,
    description: getSpreadDescription(spread, "ru"),
  });
}
