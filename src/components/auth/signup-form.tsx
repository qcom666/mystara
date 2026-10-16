"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Input } from "@/components/ui/input";
import { ConsentCheckbox } from "@/components/legal/consent-checkbox";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";
import { setPrivacyConsent } from "@/lib/legal/use-privacy-consent";

export function SignupForm() {
  const t = useTranslation();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [showConsentError, setShowConsentError] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!accepted) {
      setShowConsentError(true);
      return;
    }
    setStatus("loading");
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, acceptPrivacy: true }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.message ?? t.errors.generic);
        setStatus("error");
        return;
      }
      setPrivacyConsent("accepted");
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        router.push("/login");
        return;
      }
      router.push("/reading");
      router.refresh();
    } catch {
      setErrorMessage(t.errors.generic);
      setStatus("error");
    }
  }

  return (
    <GlassPanel className="mx-auto w-full max-w-sm">
      <h1 className="font-display text-2xl text-silver-50">{t.auth.signupTitle}</h1>
      <p className="mt-1 text-sm text-silver-400">{t.auth.signupSubtitle}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">{t.auth.nameLabel}</Label>
          <Input id="name" required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">{t.auth.emailLabel}</Label>
          <Input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">{t.auth.passwordLabel}</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
          />
        </div>
        <ConsentCheckbox
          id="accept-privacy"
          checked={accepted}
          onChange={(value) => {
            setAccepted(value);
            if (value) setShowConsentError(false);
          }}
          invalid={showConsentError && !accepted}
        />
        {status === "error" && <p className="text-xs text-red-400">{errorMessage}</p>}
        <Button type="submit" className="w-full" disabled={status === "loading"}>
          {status === "loading" ? t.common.loading : t.auth.signupCta}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-silver-400">
        {t.auth.haveAccount}{" "}
        <Link href="/login" className="text-gold-300 hover:underline">
          {t.common.signIn}
        </Link>
      </p>
    </GlassPanel>
  );
}
