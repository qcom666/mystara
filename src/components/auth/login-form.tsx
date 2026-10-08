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

interface LoginFormProps {
  googleEnabled: boolean;
}

export function LoginForm({ googleEnabled }: LoginFormProps) {
  const t = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  // Нужно только для кнопки Google: она создаёт аккаунт при первом использовании, а вход по e-mail и
  // паролю предназначен для аккаунта, владелец которого уже дал согласие при регистрации.
  const [googleConsent, setGoogleConsent] = useState(false);
  const [showConsentError, setShowConsentError] = useState(false);

  function handleGoogleSignIn() {
    if (!googleConsent) {
      setShowConsentError(true);
      return;
    }
    setPrivacyConsent("accepted");
    signIn("google", { callbackUrl: "/reading" });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("loading");
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setStatus("error");
      return;
    }
    router.push("/reading");
    router.refresh();
  }

  return (
    <GlassPanel className="mx-auto w-full max-w-sm">
      <h1 className="font-display text-2xl text-silver-50">{t.auth.loginTitle}</h1>
      <p className="mt-1 text-sm text-silver-400">{t.auth.loginSubtitle}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </div>
        {status === "error" && <p className="text-xs text-red-400">{t.auth.incorrectCredentials}</p>}
        <Button type="submit" className="w-full" disabled={status === "loading"}>
          {status === "loading" ? t.common.loading : t.auth.loginCta}
        </Button>
      </form>

      {googleEnabled && (
        <>
          <div className="my-4 flex items-center gap-3 text-xs text-silver-500">
            <span className="h-px flex-1 bg-silver-500/20" /> {t.common.or} <span className="h-px flex-1 bg-silver-500/20" />
          </div>
          <div className="mb-3 space-y-2">
            <p className="text-xs text-silver-500">{t.legal.googleHint}</p>
            <ConsentCheckbox
              id="accept-privacy-google"
              checked={googleConsent}
              onChange={(value) => {
                setGoogleConsent(value);
                if (value) setShowConsentError(false);
              }}
              invalid={showConsentError && !googleConsent}
            />
          </div>
          <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignIn}>
            {t.auth.googleCta}
          </Button>
        </>
      )}

      <p className="mt-6 text-center text-sm text-silver-400">
        {t.auth.noAccount}{" "}
        <Link href="/signup" className="text-gold-300 hover:underline">
          {t.common.signUp}
        </Link>
      </p>
    </GlassPanel>
  );
}
