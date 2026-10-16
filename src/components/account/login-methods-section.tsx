"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { TelegramWidget } from "@/components/auth/telegram-widget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";
import type { AccountData } from "@/lib/repositories/account.repository";

type Message = { kind: "ok" | "error"; text: string } | null;

/**
 * Какими способами аккаунт открывается, и как добавить недостающий: e-mail с паролем для аккаунта из
 * Telegram (вход на сайт без кода подтверждения) или Telegram для аккаунта, созданного по e-mail.
 */
export function LoginMethodsSection({
  profile,
  botUsername,
  mailConfigured,
}: {
  profile: AccountData["profile"];
  botUsername: string;
  mailConfigured: boolean;
}) {
  const t = useTranslation();
  const a = t.accountPage;
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [emailMessage, setEmailMessage] = useState<Message>(null);
  const [telegramMessage, setTelegramMessage] = useState<Message>(null);
  const [verifyMessage, setVerifyMessage] = useState<Message>(null);

  async function onAddEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setEmailMessage(null);
    try {
      const response = await fetch("/api/account/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: String(data.get("email") ?? ""), password: String(data.get("password") ?? "") }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (response.ok) {
        form.reset();
        setEmailMessage({ kind: "ok", text: a.addEmailDone });
        router.refresh();
      } else if (body?.error === "email_taken") {
        setEmailMessage({ kind: "error", text: a.addEmailTaken });
      } else if (body?.error === "invalid_input") {
        setEmailMessage({ kind: "error", text: a.addEmailInvalid });
      } else {
        setEmailMessage({ kind: "error", text: a.addEmailFailed });
      }
    } catch {
      setEmailMessage({ kind: "error", text: a.addEmailFailed });
    } finally {
      setBusy(false);
    }
  }

  async function onSendVerification() {
    setBusy(true);
    setVerifyMessage(null);
    try {
      const response = await fetch("/api/account/send-verification", { method: "POST" });
      setVerifyMessage(response.ok ? { kind: "ok", text: a.verificationSent } : { kind: "error", text: a.verificationFailed });
    } catch {
      setVerifyMessage({ kind: "error", text: a.verificationFailed });
    } finally {
      setBusy(false);
    }
  }

  async function onTelegramAuth(widgetData: string) {
    setTelegramMessage(null);
    try {
      const response = await fetch("/api/account/link-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgetData }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (response.ok) {
        setTelegramMessage({ kind: "ok", text: a.linkTelegramDone });
        router.refresh();
      } else {
        setTelegramMessage({ kind: "error", text: body?.error === "telegram_taken" ? a.linkTelegramTaken : a.linkTelegramFailed });
      }
    } catch {
      setTelegramMessage({ kind: "error", text: a.linkTelegramFailed });
    }
  }

  const emailConnected = profile.hasPassword;
  const messageClass = (message: Message) => `mt-3 text-sm ${message?.kind === "ok" ? "text-emerald-300" : "text-red-400"}`;

  return (
    <section>
      <h2 className="font-display text-xl text-silver-100">{a.loginMethodsHeading}</h2>
      <dl className="mt-3 divide-y divide-white/5 rounded-xl border border-white/10 text-sm">
        <div className="flex justify-between gap-4 px-4 py-3">
          <dt className="text-silver-400">{a.loginMethodEmail}</dt>
          <dd className="text-silver-200">{emailConnected ? `${a.methodConnected}${profile.email ? `: ${profile.email}` : ""}` : a.methodNotConnected}</dd>
        </div>
        <div className="flex justify-between gap-4 px-4 py-3">
          <dt className="text-silver-400">{a.loginMethodTelegram}</dt>
          <dd className="text-silver-200">
            {profile.telegramLinked ? `${a.methodConnected}${profile.telegramUsername ? `: @${profile.telegramUsername}` : ""}` : a.methodNotConnected}
          </dd>
        </div>
      </dl>

      {profile.email && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span className={profile.emailVerified ? "text-emerald-300" : "text-silver-400"}>
            {profile.emailVerified ? a.emailVerifiedLabel : a.emailNotVerified}
          </span>
          {!profile.emailVerified && mailConfigured && (
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={onSendVerification}>
              {a.sendVerificationCta}
            </Button>
          )}
          {verifyMessage && <span className={verifyMessage.kind === "ok" ? "text-emerald-300" : "text-red-400"}>{verifyMessage.text}</span>}
        </div>
      )}

      {!emailConnected && !profile.email && (
        <form onSubmit={onAddEmail} className="mt-5 max-w-sm space-y-3">
          <h3 className="text-sm font-medium text-silver-200">{a.addEmailTitle}</h3>
          <p className="text-xs text-silver-500">{a.addEmailBody}</p>
          <div className="space-y-1.5">
            <Label htmlFor="link-email">{t.auth.emailLabel}</Label>
            <Input id="link-email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="link-password">{t.auth.passwordLabel}</Label>
            <Input id="link-password" name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" />
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? t.common.loading : a.addEmailCta}
          </Button>
          {emailMessage && <p className={messageClass(emailMessage)}>{emailMessage.text}</p>}
        </form>
      )}

      {!profile.telegramLinked && botUsername && (
        <div className="mt-5 max-w-sm space-y-3">
          <h3 className="text-sm font-medium text-silver-200">{a.linkTelegramTitle}</h3>
          <p className="text-xs text-silver-500">{a.linkTelegramBody}</p>
          <TelegramWidget botUsername={botUsername} onAuth={onTelegramAuth} />
          {telegramMessage && <p className={messageClass(telegramMessage)}>{telegramMessage.text}</p>}
        </div>
      )}
    </section>
  );
}
