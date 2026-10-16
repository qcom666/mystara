import type { Metadata } from "next";
import { VerifyEmailStatus } from "@/components/auth/verify-email-status";

export const metadata: Metadata = { title: "E-mail confirmation", robots: { index: false, follow: false } };

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const { token = "" } = await searchParams;
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center px-4 py-16">
      <VerifyEmailStatus token={token} />
    </div>
  );
}
