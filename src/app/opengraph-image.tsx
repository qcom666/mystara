import { ImageResponse } from "next/og";

// Shown when a link to the site is shared (Telegram, messengers, social). Latin-only on
// purpose: ImageResponse's built-in font has no Cyrillic, and shipping a font file would
// eat into its 500KB bundle limit for no gain.
export const alt = "Mystara — Tarot, numerology and astrology";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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
        <div style={{ marginTop: 28, fontSize: 116, letterSpacing: 6, color: "#e6c46e", fontWeight: 700 }}>Mystara</div>
        <div style={{ marginTop: 10, width: 220, height: 2, background: "#d9b45a", opacity: 0.6 }} />
        <div style={{ marginTop: 28, fontSize: 38, letterSpacing: 8, color: "#b9b5c9" }}>TAROT · NUMEROLOGY · ASTROLOGY</div>
      </div>
    ),
    { ...size },
  );
}
