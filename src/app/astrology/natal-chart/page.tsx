import type { Metadata } from "next";
import { NatalChartFlow } from "@/components/astrology/natal-chart-flow";

export const metadata: Metadata = {
  title: "Natal Chart",
  description: "A full natal chart computed from real planetary positions — the Moon, every planet, your rising sign, houses, and aspects.",
};

export default function NatalChartPage() {
  return <NatalChartFlow />;
}
