import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BackToAccount } from "@/components/account/back-to-account";
import { SavedAstrologyView } from "@/components/account/saved-results";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { toLocalYmd } from "@/lib/local-date";
import { getAstrologyReadingForUser } from "@/lib/repositories/account.repository";
import type { Sect } from "@/modules/astrology/domain/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Astrology", robots: { index: false, follow: false } };

/** Сохранённый результат по знаку Солнца из истории, с той же дневной или ночной картой, что была выбрана. */
export default async function SavedAstrologyPage({ params }: PageProps) {
  const session = await auth().catch(() => null);
  if (!session?.user?.id) redirect("/login");
  if (!isDatabaseConfigured()) notFound();

  const { id } = await params;
  const saved = await getAstrologyReadingForUser(id, session.user.id);
  if (!saved) notFound();

  const sect: Sect | null = saved.sect === "day" || saved.sect === "night" ? saved.sect : null;
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <BackToAccount tab="history" />
      <div className="mt-4">
        <SavedAstrologyView birthDate={toLocalYmd(saved.birthDate)} sect={sect} />
      </div>
    </div>
  );
}
