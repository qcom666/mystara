import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BackToAccount } from "@/components/account/back-to-account";
import { SavedNumerologyView } from "@/components/account/saved-results";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { toLocalYmd } from "@/lib/local-date";
import { getNumerologyReadingForUser } from "@/lib/repositories/account.repository";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Numerology", robots: { index: false, follow: false } };

/** Сохранённый нумерологический расчёт из истории: тот же экран результата, пересчитанный из сохранённых данных. */
export default async function SavedNumerologyPage({ params }: PageProps) {
  const session = await auth().catch(() => null);
  if (!session?.user?.id) redirect("/login");
  if (!isDatabaseConfigured()) notFound();

  const { id } = await params;
  const saved = await getNumerologyReadingForUser(id, session.user.id);
  if (!saved) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <BackToAccount tab="history" />
      <div className="mt-4">
        <SavedNumerologyView fullName={saved.fullName ?? ""} birthDate={toLocalYmd(saved.birthDate)} />
      </div>
    </div>
  );
}
