"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/lib/i18n";
import { NATAL_CHART_FREE_FOR_TESTING } from "@/lib/pricing/natal-chart-pricing";
import type { NatalChart } from "@/modules/astrology/domain/types";
import { NatalChartInputForm, type NatalChartFormValue } from "./natal-chart-input-form";
import { NatalChartPricingPanel } from "./natal-chart-pricing-panel";
import { NatalChartResult } from "./natal-chart-result";

type Stage = "loading-credits" | "no-credits" | "form" | "generating" | "result" | "error";

export function NatalChartFlow() {
  const t = useTranslation();
  const { status } = useSession();
  // Lazy initializer, not an effect: NATAL_CHART_FREE_FOR_TESTING is a fixed
  // constant, not something to "synchronize" with after mount.
  const [stage, setStage] = useState<Stage>(() => (NATAL_CHART_FREE_FOR_TESTING ? "form" : "loading-credits"));
  const [chart, setChart] = useState<NatalChart | null>(null);

  useEffect(() => {
    if (NATAL_CHART_FREE_FOR_TESTING) return;
    if (status !== "authenticated") return;
    let cancelled = false;
    // Coming back from the card payment page the webhook may still be a moment behind — give it a few tries.
    const returningFromPayment = new URLSearchParams(window.location.search).get("payment") === "return";
    const attempts = returningFromPayment ? 8 : 1;

    async function loadCredits() {
      for (let attempt = 0; attempt < attempts; attempt++) {
        const response = await fetch("/api/natal-chart");
        if (!response.ok) throw new Error("failed");
        const data = (await response.json()) as { credits: number };
        if (data.credits > 0 || attempt === attempts - 1) return data.credits;
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      return 0;
    }

    loadCredits()
      .then((credits) => {
        if (!cancelled) setStage(credits > 0 ? "form" : "no-credits");
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
      const data: { chart: NatalChart } = await response.json();
      setChart(data.chart);
      setStage("result");
    } catch {
      setStage("error");
    }
  }

  if (status === "loading" && !NATAL_CHART_FREE_FOR_TESTING) {
    return (
      <div className="mx-auto max-w-md px-4 py-24">
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (status === "unauthenticated" && !NATAL_CHART_FREE_FOR_TESTING) {
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
        saved={!NATAL_CHART_FREE_FOR_TESTING}
        onGenerateAnother={() => {
          setChart(null);
          setStage("form");
        }}
      />
    );
  }

  return (
    <div className="px-4 py-16 sm:py-24">
      {NATAL_CHART_FREE_FOR_TESTING && (
        <p className="mx-auto mb-6 max-w-md rounded-xl border border-gold-500/25 bg-gold-500/5 p-3 text-center text-xs text-gold-300">
          {t.natalChartPage.testingModeNotice}
        </p>
      )}
      <NatalChartInputForm onSubmit={handleSubmit} />
    </div>
  );
}
