import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BackToAccount } from "@/components/account/back-to-account";
import { NatalChartResult } from "@/components/astrology/natal-chart-result";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { getNatalChartForUser } from "@/lib/repositories/account.repository";
import type { NatalChart } from "@/modules/astrology/domain/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Natal Chart", robots: { index: false, follow: false } };

/** Сохранённая натальная карта из истории пользователя: открывается без повторной оплаты и без списания кредита. */
export default async function SavedNatalChartPage({ params }: PageProps) {
  const session = await auth().catch(() => null);
  if (!session?.user?.id) redirect("/login");
  if (!isDatabaseConfigured()) notFound();

  const { id } = await params;
  const saved = await getNatalChartForUser(id, session.user.id);
  if (!saved) notFound();

  return (
    <>
      <div className="mx-auto max-w-2xl px-4 pt-8">
        <BackToAccount tab="history" />
      </div>
      <NatalChartResult chart={saved.chart as unknown as NatalChart} />
    </>
  );
}
