"use client";

import { useSession } from "next-auth/react";
import Link from "@/components/shared/localized-link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale, useTranslation } from "@/lib/i18n";
import type { NatalChart } from "@/modules/astrology/domain/types";
import { NatalChartInputForm, type NatalChartFormValue } from "./natal-chart-input-form";
import { NatalChartPricingPanel, type PanelPremiumState } from "./natal-chart-pricing-panel";
import { NatalChartResult } from "./natal-chart-result";

type Stage = "loading-credits" | "no-credits" | "form" | "generating" | "result" | "error";

/** Ответ GET /api/natal-chart: остаток кредитов и состояние подписки Premium. */
interface EntitlementResponse {
  credits: number;
  premium: { active: boolean; fullAccess: boolean; freeChartAvailable: boolean; nextFreeChartAt: string | null };
}

const hasAccess = (data: EntitlementResponse) => data.credits > 0 || data.premium.freeChartAvailable;

export function NatalChartFlow() {
  const t = useTranslation();
  const { locale } = useLocale();
  const { status } = useSession();
  const [entitlement, setEntitlement] = useState<EntitlementResponse | null>(null);
  const [stage, setStage] = useState<Stage>("loading-credits");
  const [chart, setChart] = useState<NatalChart | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    // При возврате со страницы оплаты картой вебхук может ещё не отработать, поэтому даём несколько попыток.
    const returningFromPayment = new URLSearchParams(window.location.search).get("payment") === "return";
    const attempts = returningFromPayment ? 8 : 1;

    async function loadEntitlement(): Promise<EntitlementResponse> {
      let data: EntitlementResponse | null = null;
      for (let attempt = 0; attempt < attempts; attempt++) {
        const response = await fetch("/api/natal-chart");
        if (!response.ok) throw new Error("failed");
        data = (await response.json()) as EntitlementResponse;
        if (hasAccess(data)) return data;
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      return data as EntitlementResponse;
    }

    loadEntitlement()
      .then((data) => {
        if (cancelled) return;
        setEntitlement(data);
        setStage(hasAccess(data) ? "form" : "no-credits");
      })
      .catch(() => {
        if (!cancelled) setStage("error");
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  async function handleSubmit(value: NatalChartFormValue) {
    setStage("generating");
    try {
      const response = await fetch("/api/natal-chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: value.year,
          month: value.month,
          day: value.day,
          hasExactTime: value.hasExactTime,
          hour: value.hour,
          minute: value.minute,
          placeLabel: value.placeLabel || undefined,
          latitude: value.latitude,
          longitude: value.longitude,
          timezone: value.timezone,
        }),
      });
      if (response.status === 402) {
        setStage("no-credits");
        return;
      }
      if (!response.ok) throw new Error("generation_failed");
      const data: { chart: NatalChart; reading?: { source?: string } } = await response.json();
      setChart(data.chart);
      setStage("result");
      // Следующее построение считается заново: недельная карта по Premium могла быть использована сейчас.
      setEntitlement(null);
      void fetch("/api/natal-chart")
        .then((next) => (next.ok ? (next.json() as Promise<EntitlementResponse>) : null))
        .then((next) => next && setEntitlement(next))
        .catch(() => undefined);
    } catch {
      setStage("error");
    }
  }

  const panelPremium: PanelPremiumState | undefined = entitlement
    ? { active: entitlement.premium.active, nextFreeChartAt: entitlement.premium.nextFreeChartAt }
    : undefined;
  const formatDay = (iso: string) => new Date(iso).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-GB", { day: "numeric", month: "long" });
  // Чем будет оплачено это построение: недельной картой по Premium или кредитом пакета.
  const paymentNote = entitlement?.premium.fullAccess
    ? null
    : entitlement?.premium.freeChartAvailable
      ? t.natalChartPage.premiumFreeNotice
    : entitlement?.premium.active && entitlement.premium.nextFreeChartAt
      ? t.natalChartPage.premiumNextFreeNotice.replace("{date}", formatDay(entitlement.premium.nextFreeChartAt))
      : null;

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-md px-4 py-24">
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
        <GlassPanel className="text-center">
          <h1 className="font-display text-2xl text-silver-50">{t.natalChartPage.signInTitle}</h1>
          <p className="mt-2 text-sm text-silver-400">{t.natalChartPage.signInBody}</p>
          <Button asChild className="mt-4">
            <Link href="/login">{t.common.signIn}</Link>
          </Button>
        </GlassPanel>
      </div>
    );
  }

  if (stage === "loading-credits" || stage === "generating") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
        {stage === "generating" && <p className="mb-4 text-center text-sm text-gold-300">{t.natalChartPage.generating}</p>}
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (stage === "no-credits") {
    return (
      <div className="px-4 py-16 sm:py-24">
        <NatalChartPricingPanel
          title={t.natalChartPage.noCreditsTitle}
          body={t.natalChartPage.noCreditsBody}
          onPurchased={() => setStage("form")}
          premium={panelPremium}
        />
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center sm:py-24">
        <p className="text-sm text-red-400">{t.errors.generic}</p>
      </div>
    );
  }

  if (stage === "result" && chart) {
    return (
      <NatalChartResult
        chart={chart}
        onGenerateAnother={() => {
          setChart(null);
          setStage("form");
        }}
      />
    );
  }

  return (
    <div className="px-4 py-16 sm:py-24">
      {paymentNote && (
        <p className="mx-auto mb-6 max-w-md rounded-xl border border-gold-500/25 bg-gold-500/5 p-3 text-center text-xs text-gold-300">
          {paymentNote}
        </p>
      )}
      <NatalChartInputForm onSubmit={handleSubmit} />
    </div>
  );
}
