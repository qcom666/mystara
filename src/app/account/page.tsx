import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountView, type AccountTab } from "@/components/account/account-view";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { isMailConfigured } from "@/lib/mail/mailer";
import { syncUserPaymentsQuietly } from "@/lib/payments/yookassa-sync";
import { getAccountData } from "@/lib/repositories/account.repository";
import { getOrCreateReferralCode, getReferralStats } from "@/lib/repositories/referral.repository";

export const metadata: Metadata = { title: "My account", robots: { index: false, follow: false } };

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

const TABS: readonly AccountTab[] = ["overview", "history", "favorites"];

export default async function AccountPage({ searchParams }: PageProps) {
  const session = await auth().catch(() => null);
  if (!session?.user?.id) redirect("/login");

  if (!isDatabaseConfigured()) {
    return <AccountView data={{ status: "unconfigured" }} />;
  }

  const { tab } = await searchParams;
  // Недавняя оплата картой засчитывается сразу, даже если уведомление ЮKassa ещё не пришло.
  await syncUserPaymentsQuietly(session.user.id);
  const account = await getAccountData(session.user.id);
  if (!account) redirect("/login");
  const [referralCode, referralStats] = await Promise.all([getOrCreateReferralCode(session.user.id), getReferralStats(session.user.id)]);

  return (
    <AccountView
      data={{
        status: "ready",
        account,
        isAdmin: session.user.isAdmin === true,
        telegramBotUsername: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "",
        mailConfigured: isMailConfigured(),
        referral: { code: referralCode, ...referralStats },
        tab: TABS.find((item) => item === tab) ?? "overview",
      }}
    />
  );
}
