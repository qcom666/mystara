import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountView, type AccountTab } from "@/components/account/account-view";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { getAccountData } from "@/lib/repositories/account.repository";

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
  const account = await getAccountData(session.user.id);
  if (!account) redirect("/login");

  return (
    <AccountView
      data={{
        status: "ready",
        account,
        isAdmin: session.user.isAdmin === true,
        tab: TABS.find((item) => item === tab) ?? "overview",
      }}
    />
  );
}
