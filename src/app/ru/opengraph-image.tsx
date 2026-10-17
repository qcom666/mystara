import { ImageResponse } from "next/og";
import { loadFont } from "@/lib/share/fonts";

// Превью русских страниц для Telegram, мессенджеров и соцсетей. Кириллических глифов во встроенном шрифте
// нет, поэтому нужные символы скачиваются у Google Fonts (lib/share/fonts.ts); если загрузка не удалась,
// подпись выводится латиницей, как на английской картинке.
export const alt = "Mystara — Таро, нумерология и астрология";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SUBTITLE_RU = "ТАРО · НУМЕРОЛОГИЯ · АСТРОЛОГИЯ";
const SUBTITLE_EN = "TAROT · NUMEROLOGY · ASTROLOGY";

export default async function Image() {
  const font = await loadFont("Cormorant Garamond", 600, `Mystara${SUBTITLE_RU}`);
  const subtitle = font ? SUBTITLE_RU : SUBTITLE_EN;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #05040a 0%, #120c24 55%, #1b1233 100%)",
          color: "#e9e6f2",
          fontFamily: font ? "Cormorant Garamond" : undefined,
        }}
      >
        <svg width="96" height="96" viewBox="0 0 100 100">
          <path
            d="M50 6 L58 42 L94 50 L58 58 L50 94 L42 58 L6 50 L42 42 Z"
            fill="none"
            stroke="#d9b45a"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <circle cx="50" cy="50" r="6" fill="#d9b45a" />
        </svg>
        <div style={{ marginTop: 28, fontSize: 116, letterSpacing: 6, color: "#e6c46e", fontWeight: 600 }}>Mystara</div>
        <div style={{ marginTop: 10, width: 220, height: 2, background: "#d9b45a", opacity: 0.6 }} />
        <div style={{ marginTop: 28, fontSize: 40, letterSpacing: 8, color: "#b9b5c9" }}>{subtitle}</div>
      </div>
    ),
    { ...size, fonts: font ? [font] : undefined },
  );
}
