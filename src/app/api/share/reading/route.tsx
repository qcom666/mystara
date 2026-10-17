import { ImageResponse } from "next/og";
import { loadFont } from "@/lib/share/fonts";
import { parseShareRequest, SHARE_SIZES, type ShareView } from "@/lib/share/reading-share";
import { enforceRateLimit } from "@/lib/rate-limit";

const GOLD = "#e6c46e";
const SILVER = "#b9b5c9";
const TEXT = "#ece8f5";

const COPY = {
  ru: { reversed: "перевёрнута", footer: "Для размышления и развлечения, не предсказание" },
  en: { reversed: "reversed", footer: "For reflection and entertainment, not a prediction" },
} as const;

function columnsFor(count: number): number {
  if (count <= 3) return count;
  if (count <= 6) return 3;
  return 5;
}

function siteHost(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://taroproject.vercel.app").host;
  } catch {
    return "taroproject.vercel.app";
  }
}

function ShareImage({ view }: { view: ShareView }) {
  const { width, height } = SHARE_SIZES[view.format];
  const padding = 72;
  const gap = 24;
  const columns = columnsFor(view.cards.length);
  const tileWidth = Math.min(300, Math.floor((width - padding * 2 - gap * (columns - 1)) / columns));
  const tileHeight = Math.round(tileWidth * 1.55);
  const copy = COPY[view.locale];
  const story = view.format === "story";

  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `${story ? 140 : padding}px ${padding}px ${story ? 120 : padding}px`,
        background: "linear-gradient(165deg, #05040a 0%, #120c24 50%, #1d1338 100%)",
        color: TEXT,
        fontFamily: "Inter",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontFamily: "Cormorant Garamond", fontSize: 40, letterSpacing: 12, color: GOLD }}>MYSTARA</div>
        <div style={{ marginTop: 18, width: 160, height: 2, background: GOLD, opacity: 0.55 }} />
        <div style={{ marginTop: 36, fontFamily: "Cormorant Garamond", fontSize: story ? 84 : 72, color: TEXT, textAlign: "center" }}>
          {view.spreadName}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap, width: width - padding * 2 }}>
        {view.cards.map((card, index) => (
          <div key={index} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: tileWidth }}>
            <div
              style={{
                width: tileWidth,
                height: tileHeight,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 14,
                borderRadius: 18,
                border: "2px solid rgba(217, 180, 90, 0.75)",
                background: "linear-gradient(180deg, #1a1430 0%, #0b0816 100%)",
                // ImageResponse не понимает `transform: none`, поэтому поворот добавляется только перевёрнутой карте.
                ...(card.reversed ? { transform: "rotate(180deg)" } : {}),
              }}
            >
              <div
                style={{
                  fontFamily: "Cormorant Garamond",
                  // Цифры крупно, слова (туз, фигуры) мельче, чтобы «Королева» помещалась и в узкую карту.
                  fontSize: Math.round(tileWidth * (card.mark.length > 4 ? 0.15 : card.mark.length > 2 ? 0.22 : 0.32)),
                  color: GOLD,
                }}
              >
                {card.mark}
              </div>
              <div
                style={{
                  marginTop: 12,
                  fontSize: Math.max(18, Math.round(tileWidth * 0.1)),
                  color: TEXT,
                  textAlign: "center",
                  lineHeight: 1.25,
                }}
              >
                {card.name}
              </div>
            </div>
            <div style={{ marginTop: 14, fontSize: Math.max(17, Math.round(tileWidth * 0.085)), color: SILVER, textAlign: "center" }}>
              {card.position}
            </div>
            {card.reversed && <div style={{ marginTop: 4, fontSize: 18, color: GOLD, opacity: 0.85 }}>{copy.reversed}</div>}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontSize: 30, color: GOLD }}>{siteHost()}</div>
        <div style={{ marginTop: 10, fontSize: 20, color: SILVER, opacity: 0.8 }}>{copy.footer}</div>
      </div>
    </div>
  );
}

/**
 * Картинка расклада для сторис и постов: /api/share/reading?spread=…&cards=…&locale=ru&format=story.
 * В адресе только расклад и карты (без вопроса), одинаковый адрес даёт одинаковую картинку, поэтому её можно
 * надолго кэшировать на CDN.
 */
export async function GET(request: Request) {
  const limited = enforceRateLimit(request, "share-image", { limit: 30, windowSeconds: 60 });
  if (limited) return limited;

  const view = parseShareRequest(new URL(request.url).searchParams);
  if (!view) return new Response("Not found", { status: 404 });

  const copy = COPY[view.locale];
  const allText = ["MYSTARA", view.spreadName, ...view.cards.flatMap((card) => [card.mark, card.name, card.position]), copy.reversed, copy.footer, siteHost()].join("");
  const [display, body] = await Promise.all([loadFont("Cormorant Garamond", 600, allText), loadFont("Inter", 500, allText)]);
  const fonts = [display, body].filter((font) => font !== null);

  const { width, height } = SHARE_SIZES[view.format];
  return new ImageResponse(<ShareImage view={view} />, {
    width,
    height,
    fonts,
    headers: { "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
