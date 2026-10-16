import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { isMailConfigured } from "@/lib/mail/mailer";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false, follow: false } };
// Зависит от переменных окружения почты, поэтому собирается при запросе, а не при сборке.
export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center px-4 py-16">
      <ForgotPasswordForm mailConfigured={isMailConfigured()} />
    </div>
  );
}
