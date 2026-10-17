import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { StarField } from "@/components/ui/star-field";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  // Кириллица нужна для русского интерфейса: без неё браузер подставляет системный шрифт.
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Mystara — Tarot Readings with Clarity",
    template: "%s · Mystara",
  },
  description:
    "Get clarity through Tarot, symbolism, and personalized interpretation. Free Tarot readings, card meanings, and spreads, reimagined as a premium modern ritual.",
  openGraph: {
    title: "Mystara — Tarot Readings with Clarity",
    description: "Get clarity through Tarot, symbolism, and personalized interpretation.",
    type: "website",
    siteName: "Mystara",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mystara — Tarot Readings with Clarity",
    description: "Get clarity through Tarot, symbolism, and personalized interpretation.",
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // data-scroll-behavior: плавная прокрутка из globals.css не мешает переходам между страницами.
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} ${cormorant.variable}`}>
      <body className="relative min-h-screen bg-midnight-950 font-sans text-silver-200 antialiased">
        <StarField className="fixed" />
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
