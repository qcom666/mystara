import type { Metadata } from "next";
import { AstrologyFlow } from "@/components/astrology/astrology-flow";
import { ExploreSigns } from "@/components/astrology/explore-signs";

export const metadata: Metadata = {
  title: "Astrology — Sun Sign",
  description: "Find your zodiac sun sign from your date of birth and see what it traditionally represents.",
};

export default function AstrologyPage() {
  return (
    <>
      <AstrologyFlow />
      <ExploreSigns />
    </>
  );
}
