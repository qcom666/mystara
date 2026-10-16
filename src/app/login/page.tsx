import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center px-4 py-16">
      <LoginForm botUsername={process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? ""} />
    </div>
  );
}
