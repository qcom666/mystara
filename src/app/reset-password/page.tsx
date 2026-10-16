import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Set a new password", robots: { index: false, follow: false } };

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { token = "" } = await searchParams;
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center px-4 py-16">
      <ResetPasswordForm token={token} />
    </div>
  );
}
