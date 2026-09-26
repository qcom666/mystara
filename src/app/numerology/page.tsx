import type { Metadata } from "next";
import { ExploreNumbers } from "@/components/numerology/explore-numbers";
import { NumerologyFlow } from "@/components/numerology/numerology-flow";

export const metadata: Metadata = {
  title: "Numerology — Life Path Number",
  description: "Calculate your Life Path Number from your date of birth and see what it traditionally represents.",
};

export default function NumerologyPage() {
  return (
    <>
      <NumerologyFlow />
      <ExploreNumbers />
    </>
  );
}
