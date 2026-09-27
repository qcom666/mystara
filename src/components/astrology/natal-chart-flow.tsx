"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/lib/i18n";
import type { NatalChart } from "@/modules/astrology/domain/types";
import { NatalChartInputForm, type NatalChartFormValue } from "./natal-chart-input-form";
import { NatalChartPricingPanel } from "./natal-chart-pricing-panel";
import { NatalChartResult } from "./natal-chart-result";

type Stage = "loading-credits" | "no-credits" | "form" | "generating" | "result" | "error";

export function NatalChartFlow() {
  const t = useTranslation();
  const { status } = useSession();
  const [stage, setStage] = useState<Stage>("loading-credits");
  const [chart, setChart] = useState<NatalChart | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    fetch("/api/natal-chart")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("failed"))))
      .then((data: { credits: number }) => {
        if (!cancelled) setStage(data.credits > 0 ? "form" : "no-credits");
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
        <NatalChartPricingPanel title={t.natalChartPage.noCreditsTitle} body={t.natalChartPage.noCreditsBody} />
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
      <NatalChartInputForm onSubmit={handleSubmit} />
    </div>
  );
}
