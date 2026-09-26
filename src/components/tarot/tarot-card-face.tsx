import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { getCardName } from "@/modules/tarot/domain/deck";
import type { Orientation, Suit, TarotCard } from "@/modules/tarot/domain/types";

/**
 * There's no licensed Rider-Waite-style artwork available to ship (see
 * PROJECT_ARCHITECTURE.md Decision Log #3), so card faces are generated
 * here. The layout follows the classic tarot template — numeral across the
 * top, one central symbol, a name plate at the bottom — but reads modern:
 * a dark twilight gradient instead of parchment, thin gold linework instead
 * of heavy ink, and the symbol set inside an arched "window" (an Art-Deco
 * echo of the arched frames many traditional decks use).
 *
 * Major Arcana each get a distinct glyph loosely echoing their traditional
 * (RWS-lineage) iconography — an infinity for the Magician, an inverted
 * pentagram for the Devil, scales for Justice — rather than one shared
 * emblem for all 22. `TarotCard.image` is reserved for real artwork later.
 */

interface CardTheme {
  mid: string;
  end: string;
  accent: string;
}

const THEMES: Record<"major" | Suit, CardTheme> = {
  major: { mid: "var(--violet-600)", end: "var(--gold-600)", accent: "var(--gold-300)" },
  wands: { mid: "var(--midnight-600)", end: "var(--gold-600)", accent: "var(--gold-300)" },
  cups: { mid: "var(--midnight-600)", end: "var(--violet-500)", accent: "var(--violet-300)" },
  swords: { mid: "var(--midnight-700)", end: "var(--midnight-600)", accent: "var(--silver-200)" },
  pentacles: { mid: "var(--midnight-600)", end: "var(--gold-500)", accent: "var(--gold-300)" },
};

function getTheme(card: TarotCard): CardTheme {
  return card.arcana === "major" ? THEMES.major : THEMES[card.suit ?? "major"];
}

function toRoman(value: number): string {
  if (value === 0) return "0";
  const table: [number, string][] = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let remaining = value;
  let result = "";
  for (const [amount, symbol] of table) {
    while (remaining >= amount) {
      result += symbol;
      remaining -= amount;
    }
  }
  return result;
}

const COURT_LABELS: Record<Locale, Record<number, string>> = {
  en: { 11: "PAGE", 12: "KNIGHT", 13: "QUEEN", 14: "KING" },
  ru: { 11: "ПАЖ", 12: "РЫЦАРЬ", 13: "КОРОЛЕВА", 14: "КОРОЛЬ" },
};

function minorRankLabel(number: number, locale: Locale): string {
  return COURT_LABELS[locale][number] ?? toRoman(number);
}

function splitName(name: string): string[] {
  if (name.length <= 13) return [name];
  const words = name.split(" ");
  if (words.length <= 1) return [name];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

// Computed coordinates are rounded: Math.cos/sin can differ in the last
// bit between the server's and the browser's JS engine, and an unrounded
// `x2="40.58359213500126"` vs `"40.583592135001254"` is a hydration mismatch.
const n = (value: number) => Math.round(value * 100) / 100;

// Every glyph is drawn in a local frame centered on (60, 40), roughly ±28
// units, then scaled up into the arched window by the card face.

function radialPoints(count: number, radius: number, startAngle = -Math.PI / 2) {
  return Array.from({ length: count }, (_, i) => {
    const angle = startAngle + (Math.PI * 2 * i) / count;
    return { x: n(60 + radius * Math.cos(angle)), y: n(40 + radius * Math.sin(angle)) };
  });
}

function starPath(points: number, outerR: number, innerR: number, startAngle = -Math.PI / 2): string {
  const coords = Array.from({ length: points * 2 }, (_, i) => {
    const angle = startAngle + (Math.PI * i) / points;
    const r = i % 2 === 0 ? outerR : innerR;
    return `${n(60 + r * Math.cos(angle))} ${n(40 + r * Math.sin(angle))}`;
  });
  return `M ${coords[0]} ${coords
    .slice(1)
    .map((c) => `L ${c}`)
    .join(" ")} Z`;
}

function pentagramPath(inverted: boolean): string {
  const pts = radialPoints(5, 28, inverted ? Math.PI / 2 : -Math.PI / 2);
  const order = [0, 2, 4, 1, 3];
  return `${order.map((i, idx) => `${idx === 0 ? "M" : "L"} ${pts[i].x} ${pts[i].y}`).join(" ")} Z`;
}

/**
 * A crescent: the big circle (radius R at cx,cy) minus a "bite" circle
 * (radius r, shifted right by d). Built from the two circles' intersection
 * points so the arcs are never degenerate.
 */
function crescentPath(cx: number, cy: number, R: number, r: number, d: number): string {
  const a = (d * d + R * R - r * r) / (2 * d);
  const h = Math.sqrt(R * R - a * a);
  const x = n(cx + a);
  return `M ${x} ${n(cy - h)} A ${R} ${R} 0 1 0 ${x} ${n(cy + h)} A ${r} ${r} 0 0 1 ${x} ${n(cy - h)} Z`;
}

function SunburstGlyph({ color, rays = 8 }: { color: string; rays?: number }) {
  const outer = radialPoints(rays, 22);
  const inner = radialPoints(rays, 13);
  return (
    <g stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none">
      <circle cx="60" cy="40" r="10" />
      {outer.map((p, i) => (
        <line key={i} x1={inner[i].x} y1={inner[i].y} x2={p.x} y2={p.y} />
      ))}
    </g>
  );
}

function SmallWheel({ cx, color, r = 12 }: { cx: number; color: string; r?: number }) {
  const spokes = Array.from({ length: 4 }, (_, i) => {
    const angle = (Math.PI / 4) * i;
    return {
      x1: n(cx + r * Math.cos(angle)),
      y1: n(40 + r * Math.sin(angle)),
      x2: n(cx - r * Math.cos(angle)),
      y2: n(40 - r * Math.sin(angle)),
    };
  });
  return (
    <g stroke={color} strokeWidth="2" fill="none">
      <circle cx={cx} cy="40" r={r} />
      {spokes.map((s, i) => (
        <line key={i} {...s} />
      ))}
    </g>
  );
}

const MAJOR_GLYPHS: Record<string, (color: string) => ReactNode> = {
  "the-fool": (color) => (
    <g stroke={color} strokeWidth="2.5" strokeLinecap="round">
      <line x1="60" y1="10" x2="60" y2="70" />
      <line x1="30" y1="40" x2="90" y2="40" />
      <line x1="41" y1="21" x2="79" y2="59" strokeWidth="1.5" opacity="0.65" />
      <line x1="79" y1="21" x2="41" y2="59" strokeWidth="1.5" opacity="0.65" />
    </g>
  ),
  "the-magician": (color) => (
    <path
      d="M36 40 C36 26 50 26 60 40 C70 54 84 54 84 40 C84 26 70 26 60 40 C50 54 36 54 36 40 Z"
      stroke={color}
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
  ),
  "the-high-priestess": (color) => (
    <g>
      <g stroke={color} strokeWidth="2.5" strokeLinecap="round">
        <line x1="36" y1="12" x2="36" y2="68" />
        <line x1="84" y1="12" x2="84" y2="68" />
      </g>
      <path d={crescentPath(64, 40, 14, 11, 7)} fill={color} stroke="none" />
    </g>
  ),
  "the-empress": (color) => (
    <g stroke={color} strokeWidth="2" fill="none">
      {radialPoints(6, 15).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="8" />
      ))}
      <circle cx="60" cy="40" r="3.5" fill={color} stroke="none" />
    </g>
  ),
  "the-emperor": (color) => (
    <g stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none">
      <path d="M50 18 Q34 24 37 40 Q39 53 52 51" />
      <path d="M70 18 Q86 24 83 40 Q81 53 68 51" />
    </g>
  ),
  "the-hierophant": (color) => (
    <g stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none">
      <line x1="40" y1="20" x2="80" y2="60" />
      <line x1="80" y1="20" x2="40" y2="60" />
      <circle cx="40" cy="20" r="4.5" />
      <circle cx="80" cy="20" r="4.5" />
    </g>
  ),
  "the-lovers": (color) => (
    <g stroke={color} strokeWidth="2.5" fill="none">
      <circle cx="49" cy="40" r="16" />
      <circle cx="71" cy="40" r="16" />
    </g>
  ),
  "the-chariot": (color) => (
    <g>
      <SmallWheel cx={42} color={color} r={13} />
      <SmallWheel cx={78} color={color} r={13} />
    </g>
  ),
  strength: (color) => <path d="M33 52 Q48 18 60 40 Q72 62 87 28" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />,
  "the-hermit": (color) => (
    <g stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d="M48 58 L72 58 L66 28 L54 28 Z" />
      <line x1="60" y1="28" x2="60" y2="14" />
      <circle cx="60" cy="44" r="3.5" fill={color} stroke="none" />
    </g>
  ),
  "wheel-of-fortune": (color) => <SmallWheel cx={60} color={color} r={27} />,
  justice: (color) => (
    <g stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none">
      <line x1="60" y1="14" x2="60" y2="64" />
      <line x1="34" y1="24" x2="86" y2="24" />
      <path d="M34 24 Q28 40 34 47 Q40 40 34 24 Z" />
      <path d="M86 24 Q80 40 86 47 Q92 40 86 24 Z" />
    </g>
  ),
  "the-hanged-man": (color) => (
    <g stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <circle cx="60" cy="21" r="6.5" />
      <path d="M45 33 L75 33 L60 62 Z" />
    </g>
  ),
  death: (color) => (
    <g stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none">
      <line x1="26" y1="50" x2="94" y2="50" />
      <path d="M42 50 A18 18 0 0 1 78 50" />
      <line x1="60" y1="20" x2="60" y2="27" />
    </g>
  ),
  temperance: (color) => (
    <g stroke={color} strokeWidth="2.5" strokeLinejoin="round" fill="none">
      <path d="M38 14 L82 14 L60 40 Z" />
      <path d="M38 66 L82 66 L60 40 Z" />
    </g>
  ),
  "the-devil": (color) => <path d={pentagramPath(true)} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" />,
  "the-tower": (color) => <path d="M67 8 L44 42 L58 42 L48 72 L78 36 L62 36 Z" fill={color} stroke="none" />,
  "the-star": (color) => <path d={starPath(8, 29, 13)} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />,
  "the-moon": (color) => <path d={crescentPath(66, 40, 27, 22, 15)} fill={color} stroke="none" />,
  "the-sun": (color) => <SunburstGlyph color={color} />,
  judgement: (color) => {
    const rays = Array.from({ length: 7 }, (_, i) => {
      const angle = ((200 + i * (140 / 6)) * Math.PI) / 180;
      return {
        x1: n(60 + 9 * Math.cos(angle)),
        y1: n(62 + 9 * Math.sin(angle)),
        x2: n(60 + 34 * Math.cos(angle)),
        y2: n(62 + 34 * Math.sin(angle)),
      };
    });
    return (
      <g stroke={color} strokeWidth="2.5" strokeLinecap="round">
        {rays.map((ray, i) => (
          <line key={i} {...ray} />
        ))}
        <circle cx="60" cy="62" r="3.5" fill={color} stroke="none" />
      </g>
    );
  },
  "the-world": (color) => (
    <g stroke={color} strokeWidth="2.5" fill="none">
      <circle cx="60" cy="40" r="24" />
      <line x1="60" y1="8" x2="60" y2="16" />
      <line x1="60" y1="64" x2="60" y2="72" />
      <line x1="28" y1="40" x2="36" y2="40" />
      <line x1="84" y1="40" x2="92" y2="40" />
    </g>
  ),
};

function MajorGlyph({ cardId, color }: { cardId: string; color: string }) {
  const render = MAJOR_GLYPHS[cardId];
  return <>{render ? render(color) : <SunburstGlyph color={color} />}</>;
}

function SuitGlyph({ suit, color }: { suit: Suit; color: string }) {
  switch (suit) {
    case "wands":
      return (
        <g stroke={color} strokeWidth="3" strokeLinecap="round" fill="none">
          <line x1="60" y1="8" x2="60" y2="72" />
          <line x1="47" y1="18" x2="73" y2="18" />
          <line x1="50" y1="30" x2="70" y2="30" />
        </g>
      );
    case "cups":
      return (
        <g stroke={color} strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M34 14 Q34 46 60 46 Q86 46 86 14" />
          <line x1="60" y1="46" x2="60" y2="64" />
          <line x1="41" y1="70" x2="79" y2="70" />
        </g>
      );
    case "swords":
      return (
        <g strokeLinecap="round" fill="none">
          <line x1="60" y1="6" x2="60" y2="60" stroke={color} strokeWidth="3" />
          <line x1="41" y1="24" x2="79" y2="24" stroke={color} strokeWidth="3" />
          <path d="M47 60 L73 60 L60 74 Z" fill={color} />
        </g>
      );
    case "pentacles":
      return <path d={pentagramPath(false)} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" />;
    default:
      return null;
  }
}

// The arched window the symbol sits in: 152 wide, springing at y=140.
const WINDOW_PATH = "M44 262 V140 A76 76 0 0 1 196 140 V262 Z";
const WINDOW_INNER_PATH = "M52 254 V140 A68 68 0 0 1 188 140 V254 Z";
const GLYPH_CENTER = { x: 120, y: 172 };
const GLYPH_SCALE = 1.5;
const STARS: [number, number, number][] = [
  [70, 122, 1.3],
  [172, 112, 1],
  [88, 226, 1],
  [158, 236, 1.4],
  [64, 184, 1],
  [178, 178, 1.2],
  [120, 94, 1.1],
  [150, 138, 0.9],
];

export interface TarotCardFaceProps {
  card: TarotCard;
  orientation?: Orientation;
  /** Defaults to "en" — the SVG name text switches to `card.nameRu` for "ru". */
  locale?: Locale;
  className?: string;
}

export function TarotCardFace({ card, orientation = "upright", locale = "en", className }: TarotCardFaceProps) {
  const theme = getTheme(card);
  const displayName = getCardName(card, locale);
  const nameLines = splitName(displayName);
  const bodyId = `body-${card.id}`;
  const windowGlowId = `win-${card.id}`;
  const clipId = `clip-${card.id}`;
  const numeralLabel = card.arcana === "major" ? toRoman(card.number) : minorRankLabel(card.number, locale);
  const numeralFontSize = numeralLabel.length > 4 ? 14 : 22;
  const corners: [number, number][] = [
    [20, 20],
    [220, 20],
    [20, 380],
    [220, 380],
  ];
  const nameStartY = nameLines.length === 1 ? 335 : 323;
  const glyphTransform = `translate(${GLYPH_CENTER.x - 60 * GLYPH_SCALE} ${GLYPH_CENTER.y - 40 * GLYPH_SCALE}) scale(${GLYPH_SCALE})`;

  return (
    <svg
      viewBox="0 0 240 400"
      className={className}
      role="img"
      aria-label={`${displayName}${orientation === "reversed" ? (locale === "ru" ? " (перевёрнутая)" : " (reversed)") : ""}`}
    >
      <defs>
        <linearGradient id={bodyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--midnight-900)" />
          <stop offset="55%" stopColor={theme.mid} />
          <stop offset="100%" stopColor={theme.end} />
        </linearGradient>
        <radialGradient id={windowGlowId} cx="50%" cy="52%" r="55%">
          <stop offset="0%" stopColor={theme.accent} stopOpacity="0.28" />
          <stop offset="100%" stopColor={theme.accent} stopOpacity="0" />
        </radialGradient>
        <clipPath id={clipId}>
          <path d={WINDOW_PATH} />
        </clipPath>
      </defs>

      <rect x="4" y="4" width="232" height="392" rx="16" fill={`url(#${bodyId})`} stroke="var(--gold-400)" strokeOpacity="0.6" strokeWidth="1.5" />
      <rect x="12" y="12" width="216" height="376" rx="11" fill="none" stroke="var(--gold-300)" strokeOpacity="0.28" />

      {corners.map(([x, y]) => (
        <path
          key={`${x}-${y}`}
          d={`M ${x - 6} ${y} L ${x} ${y - 6} L ${x + 6} ${y} L ${x} ${y + 6} Z`}
          fill="var(--gold-300)"
          fillOpacity="0.18"
          stroke="var(--gold-300)"
          strokeOpacity="0.8"
          strokeWidth="1.25"
        />
      ))}

      {/* Numeral cartouche */}
      <g stroke={theme.accent} strokeOpacity="0.45">
        <line x1="40" y1="40" x2="96" y2="40" />
        <line x1="144" y1="40" x2="200" y2="40" />
      </g>
      <path d="M36 40 L40 36 L44 40 L40 44 Z M196 40 L200 36 L204 40 L200 44 Z" fill={theme.accent} fillOpacity="0.7" />
      <text x="120" y={40 + numeralFontSize * 0.36} textAnchor="middle" fontSize={numeralFontSize} fontFamily="var(--font-display)" fill={theme.accent} letterSpacing="1.5">
        {numeralLabel}
      </text>

      {/* Arched window */}
      <path d={WINDOW_PATH} fill="var(--midnight-950)" fillOpacity="0.5" />
      <path d={WINDOW_PATH} fill={`url(#${windowGlowId})`} />
      <g clipPath={`url(#${clipId})`} stroke={theme.accent} fill="none">
        <circle cx={GLYPH_CENTER.x} cy={GLYPH_CENTER.y} r="62" strokeOpacity="0.16" />
        <circle cx={GLYPH_CENTER.x} cy={GLYPH_CENTER.y} r="82" strokeOpacity="0.1" strokeDasharray="2 5" />
        {Array.from({ length: 16 }, (_, i) => {
          const angle = (Math.PI * 2 * i) / 16;
          return (
            <line
              key={i}
              x1={n(GLYPH_CENTER.x + 66 * Math.cos(angle))}
              y1={n(GLYPH_CENTER.y + 66 * Math.sin(angle))}
              x2={n(GLYPH_CENTER.x + 96 * Math.cos(angle))}
              y2={n(GLYPH_CENTER.y + 96 * Math.sin(angle))}
              strokeOpacity="0.1"
            />
          );
        })}
        {STARS.map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={theme.accent} stroke="none" fillOpacity="0.55" />
        ))}
      </g>
      <path d={WINDOW_PATH} fill="none" stroke="var(--gold-400)" strokeOpacity="0.65" strokeWidth="1.3" />
      <path d={WINDOW_INNER_PATH} fill="none" stroke={theme.accent} strokeOpacity="0.22" />

      <g transform={glyphTransform}>
        {card.arcana === "major" ? <MajorGlyph cardId={card.id} color={theme.accent} /> : <SuitGlyph suit={card.suit as Suit} color={theme.accent} />}
      </g>

      {/* Name plate */}
      <rect x="28" y="286" width="184" height="78" rx="8" fill="var(--midnight-950)" fillOpacity="0.5" stroke="var(--gold-400)" strokeOpacity="0.4" />
      <path d="M120 281 L126 287 L120 293 L114 287 Z" fill="var(--gold-300)" fillOpacity="0.9" />
      {nameLines.map((line, i) => (
        <text
          key={i}
          x="120"
          y={nameStartY + i * 22}
          textAnchor="middle"
          fontSize="17"
          fontFamily="var(--font-display)"
          fontWeight={600}
          fill="white"
          letterSpacing="0.4"
        >
          {line}
        </text>
      ))}
      <g fill="var(--gold-300)" fillOpacity="0.6">
        <circle cx="106" cy="376" r="1.6" />
        <circle cx="120" cy="376" r="2" />
        <circle cx="134" cy="376" r="1.6" />
      </g>
    </svg>
  );
}
