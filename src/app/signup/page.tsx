import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Create your account" };

export default function SignupPage() {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center px-4 py-16">
      <SignupForm />
    </div>
  );
}
