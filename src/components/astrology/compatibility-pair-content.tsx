import { Suspense } from "react";
import { AnotherPairHeading, CompatibilityFooterLinks, CompatibilityPicker, CompatibilityResult } from "@/components/astrology/compatibility-view";
import { GlassPanel } from "@/components/ui/glass-panel";
import type { Compatibility } from "@/modules/astrology/services/compatibility";

/** Содержимое страницы пары знаков (общее для английского и русского адреса). */
export function CompatibilityPairContent({ result }: { result: Compatibility }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <CompatibilityResult result={result} />
      <GlassPanel className="mt-10">
        <AnotherPairHeading />
        <Suspense>
          <CompatibilityPicker initialFirst={result.first} initialSecond={result.second} />
        </Suspense>
      </GlassPanel>
      <CompatibilityFooterLinks />
    </div>
  );
}
