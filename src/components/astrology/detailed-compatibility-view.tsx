"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  Anchor,
  ArrowRight,
  Brain,
  Compass,
  Feather,
  Flame,
  Gem,
  Hammer,
  Handshake,
  Heart,
  HeartHandshake,
  House,
  InfinityIcon,
  Laugh,
  LifeBuoy,
  Lightbulb,
  type LucideIcon,
  MessageCircle,
  MountainSnow,
  Scale,
  ShieldCheck,
  Smile,
  Sparkles,
  Sprout,
  TrendingUp,
} from "lucide-react";
import { type CSSProperties, Suspense, useId } from "react";
import { CountUp } from "@/components/motion/effects";
import { EASE_OUT, SplitWords } from "@/components/motion/reveal";
import Link from "@/components/shared/localized-link";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useLocale, useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { AspectBand } from "@/modules/astrology/domain/compatibility-details.data";
import type { ZodiacSignId } from "@/modules/astrology/domain/types";
import { localizeZodiacSign, requireZodiacSignById } from "@/modules/astrology/domain/zodiac-signs.data";
import {
  type AspectScore,
  COMPATIBILITY_INDEX_PATH,
  type CompatibilityMode,
  compatibilityPath,
  type DetailedCompatibility,
  getDetailedCompatibility,
  topPairs,
} from "@/modules/astrology/services/detailed-compatibility";
import { CompatibilityFooterLinks, CompatibilityPicker } from "./compatibility-view";

/** Символ знака текстом, а не цветным эмодзи (U+FE0E). */
const asText = (symbol: string) => `${symbol}︎`;

const ASPECT_ICONS: Record<AspectScore["id"], LucideIcon> = {
  attraction: Flame,
  emotional: HeartHandshake,
  communication: MessageCircle,
  trust: ShieldCheck,
  values: Compass,
  everyday: House,
  tenderness: Heart,
  conflicts: Scale,
  fun: Laugh,
  freedom: Feather,
  growth: Sprout,
  longTerm: InfinityIcon,
  interests: Sparkles,
  understanding: Brain,
  support: LifeBuoy,
  adventures: MountainSnow,
  humor: Smile,
  reliability: Anchor,
  projects: Hammer,
  inspiration: Lightbulb,
  lasting: Gem,
};

/** Цвет пункта по уровню: высокий — золото, средний — фиолетовый, низкий — спокойное серебро. */
const BAND_STYLES: Record<AspectBand, { text: string; bar: string; icon: string }> = {
  high: { text: "text-gold-300", bar: "from-gold-300 to-gold-500", icon: "border-gold-400/40 bg-gold-500/10 text-gold-300" },
  mid: { text: "text-violet-300", bar: "from-violet-300 to-violet-500", icon: "border-violet-400/40 bg-violet-500/10 text-violet-300" },
  low: { text: "text-silver-300", bar: "from-silver-400 to-silver-300", icon: "border-silver-500/40 bg-white/5 text-silver-300" },
};

/** Переключатель «Любовь / Дружба»: золотая подложка переезжает к выбранному режиму. */
export function CompatibilityModeTabs({ mode, pair }: { mode: CompatibilityMode; pair?: [ZodiacSignId, ZodiacSignId] }) {
  const t = useTranslation();
  const reduceMotion = useReducedMotion();
  const modes: { id: CompatibilityMode; icon: LucideIcon }[] = [
    { id: "love", icon: Heart },
    { id: "friendship", icon: Handshake },
  ];
  return (
    <nav className="mx-auto flex w-fit gap-1 rounded-full border border-white/10 bg-midnight-900/70 p-1">
      {modes.map((item) => {
        const active = item.id === mode;
        const href = pair ? compatibilityPath(item.id, ...pair) : COMPATIBILITY_INDEX_PATH[item.id];
        return (
          <Link
            key={item.id}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "focus-ring relative isolate flex items-center gap-2 rounded-full px-5 py-2 text-sm transition-colors",
              active ? "font-medium text-midnight-950" : "text-silver-300 hover:text-gold-300",
            )}
          >
            {active && (
              <motion.span
                layoutId="compatibility-mode-pill"
                className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 shadow-[0_0_20px_-4px_rgba(212,175,55,0.7)]"
                transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <item.icon className="h-4 w-4" />
            {t.compatibilityPage.modes[item.id]}
          </Link>
        );
      })}
    </nav>
  );
}

/** Два знака слетаются друг к другу, между ними прорисовывается дуга, в центре загорается сердце или рукопожатие. */
function PairHero({ first, second, mode }: { first: ZodiacSignId; second: ZodiacSignId; mode: CompatibilityMode }) {
  const { locale } = useLocale();
  const a = localizeZodiacSign(requireZodiacSignById(first), locale);
  const b = localizeZodiacSign(requireZodiacSignById(second), locale);
  const CenterIcon = mode === "love" ? Heart : Handshake;
  const glyph = "relative flex h-20 w-20 items-center justify-center rounded-full border border-gold-400/40 bg-midnight-900/80 font-display text-4xl text-gradient-gold shadow-[0_0_40px_-10px_rgba(212,175,55,0.7)] sm:h-24 sm:w-24 sm:text-5xl";

  return (
    <div className="relative mx-auto mt-8 h-40 max-w-md sm:h-44">
      <svg aria-hidden="true" viewBox="0 0 400 160" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`arc-${mode}`} x1="0" x2="1">
            <stop offset="0%" stopColor="var(--gold-500)" />
            <stop offset="50%" stopColor={mode === "love" ? "var(--gold-200)" : "var(--violet-300)"} />
            <stop offset="100%" stopColor="var(--gold-500)" />
          </linearGradient>
        </defs>
        <motion.path
          data-reveal
          d="M 70 92 Q 200 -6 330 92"
          fill="none"
          stroke={`url(#arc-${mode})`}
          strokeWidth="1.5"
          strokeDasharray="4 6"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.5, ease: EASE_OUT }}
        />
      </svg>

      <motion.div
        data-reveal
        className="absolute left-0 top-1/2 -mt-10 flex flex-col items-center sm:-mt-12"
        initial={{ opacity: 0, x: -50, rotate: -90 }}
        animate={{ opacity: 1, x: 0, rotate: 0 }}
        transition={{ type: "spring", stiffness: 90, damping: 14, delay: 0.1 }}
      >
        <span className={glyph}>{asText(a.symbol)}</span>
        <span className="mt-2 text-sm text-silver-300">{a.name}</span>
      </motion.div>

      <motion.div
        data-reveal
        className="absolute right-0 top-1/2 -mt-10 flex flex-col items-center sm:-mt-12"
        initial={{ opacity: 0, x: 50, rotate: 90 }}
        animate={{ opacity: 1, x: 0, rotate: 0 }}
        transition={{ type: "spring", stiffness: 90, damping: 14, delay: 0.1 }}
      >
        <span className={glyph}>{asText(b.symbol)}</span>
        <span className="mt-2 text-sm text-silver-300">{b.name}</span>
      </motion.div>

      <motion.div
        data-reveal
        aria-hidden="true"
        className="absolute left-1/2 top-[18%] -ml-7 flex h-14 w-14 items-center justify-center"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 12, delay: 1.1 }}
      >
        <span
          className="absolute inset-0 rounded-full bg-gold-400/40 blur-xl motion-safe:animate-glow-pulse"
          style={{ "--glow-min": 0.4, "--glow-max": 1, animationDuration: "2.4s" } as CSSProperties}
        />
        <CenterIcon className="relative h-8 w-8 fill-gold-400/30 text-gold-300 motion-safe:animate-pulse-scale" style={{ "--pulse": 1.15 } as CSSProperties} />
      </motion.div>
    </div>
  );
}

/** Кольцо общей совместимости: заполняется вместе с отсчётом процентов. */
function OverallGauge({ value, verdict }: { value: number; verdict: string }) {
  const t = useTranslation();
  const gradientId = useId();
  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="mt-6 flex flex-col items-center">
      <div className="relative h-44 w-44 sm:h-48 sm:w-48">
        <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90" aria-hidden="true">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--gold-300)" />
              <stop offset="100%" stopColor="var(--gold-600)" />
            </linearGradient>
          </defs>
          <circle cx="90" cy="90" r={radius} fill="none" stroke="var(--midnight-700)" strokeWidth="10" />
          <motion.circle
            data-reveal
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference.toFixed(2)}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - value / 100) }}
            transition={{ duration: 1.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ filter: "drop-shadow(0 0 6px rgba(212,175,55,0.55))" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-5xl text-gold-300 sm:text-6xl">
            <CountUp value={value} duration={1.8} />
            <span className="text-3xl">%</span>
          </span>
          <span className="text-[10px] uppercase tracking-[0.14em] text-silver-400">{t.compatibilityPage.overallLabel}</span>
        </div>
      </div>
      <motion.p
        data-reveal
        className="mt-4 font-display text-2xl sm:text-3xl"
        initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.8, delay: 1.6, ease: EASE_OUT }}
      >
        <span className="text-shimmer-gold">{verdict}</span>
      </motion.p>
    </div>
  );
}

const gridVariants: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: EASE_OUT } },
};

/** Пункт разбора: значок, название, проценты, шкала и пояснение. */
function AspectCard({ aspect, index }: { aspect: AspectScore; index: number }) {
  const { locale } = useLocale();
  const Icon = ASPECT_ICONS[aspect.id];
  const style = BAND_STYLES[aspect.band];
  return (
    <motion.div variants={cardVariants} data-reveal className="h-full">
      <GlassPanel scrollReveal={false} padding="sm" className="h-full">
        <div className="flex items-center gap-3">
          <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full border", style.icon)}>
            <Icon className="h-4 w-4" />
          </span>
          <h3 className="flex-1 text-sm font-medium text-silver-100">{aspect.title[locale]}</h3>
          <span className={cn("font-display text-2xl", style.text)}>
            <CountUp value={aspect.score} duration={1.3} />%
          </span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-midnight-700" role="presentation">
          <motion.div
            className={cn("h-full origin-left rounded-full bg-gradient-to-r", style.bar)}
            style={{ width: `${aspect.score}%` }}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.15 + (index % 2) * 0.08 }}
          />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-silver-400">{aspect.text[locale]}</p>
      </GlassPanel>
    </motion.div>
  );
}

/** Список из трёх пунктов: сильные стороны или зоны роста. */
function AspectList({ title, aspects, icon: Icon }: { title: string; aspects: AspectScore[]; icon: LucideIcon }) {
  const { locale } = useLocale();
  return (
    <GlassPanel>
      <h2 className="flex items-center gap-2 font-display text-lg text-silver-100">
        <Icon className="h-5 w-5 text-gold-400" />
        {title}
      </h2>
      <ul className="mt-3 space-y-2">
        {aspects.map((aspect) => {
          const AspectIcon = ASPECT_ICONS[aspect.id];
          return (
            <li key={aspect.id} className="flex items-center gap-3 text-sm">
              <AspectIcon className={cn("h-4 w-4 shrink-0", BAND_STYLES[aspect.band].text)} />
              <span className="flex-1 text-silver-200">{aspect.title[locale]}</span>
              <span className={cn("font-medium", BAND_STYLES[aspect.band].text)}>{aspect.score}%</span>
            </li>
          );
        })}
      </ul>
    </GlassPanel>
  );
}

/** Подробный разбор пары в любви или дружбе. */
export function DetailedCompatibilityContent({ result }: { result: DetailedCompatibility }) {
  const t = useTranslation();
  const { locale } = useLocale();
  const copy = t.compatibilityPage;
  const a = localizeZodiacSign(requireZodiacSignById(result.first), locale);
  const b = localizeZodiacSign(requireZodiacSignById(result.second), locale);
  const otherMode: CompatibilityMode = result.mode === "love" ? "friendship" : "love";
  const other = getDetailedCompatibility(result.first, result.second, otherMode);
  const title = (result.mode === "love" ? copy.pairTitleLove : copy.pairTitleFriendship).replace("{first}", a.name).replace("{second}", b.name);

  return (
    <div className="mx-auto max-w-3xl overflow-x-clip px-4 py-12 sm:py-16">
      <CompatibilityModeTabs mode={result.mode} pair={[result.first, result.second]} />

      <PairHero first={result.first} second={result.second} mode={result.mode} />

      <div className="text-center">
        <h1 className="mt-4 font-display text-3xl text-silver-50 sm:text-4xl">
          <SplitWords text={title} immediate delay={0.3} />
        </h1>
        <OverallGauge value={result.overall} verdict={result.verdict[locale]} />
      </div>

      <GlassPanel className="mt-8">
        <p className="text-sm leading-relaxed text-silver-300">{result.summary[locale]}</p>
      </GlassPanel>

      <section className="mt-12">
        <h2 className="text-center font-display text-2xl text-silver-100">{copy.aspectsHeading}</h2>
        <motion.div
          className="mt-6 grid gap-4 sm:grid-cols-2"
          variants={gridVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.05 }}
        >
          {result.aspects.map((aspect, index) => (
            <AspectCard key={aspect.id} aspect={aspect} index={index} />
          ))}
        </motion.div>
      </section>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <AspectList title={copy.strengthsHeading} aspects={result.strengths} icon={TrendingUp} />
        <AspectList title={copy.growthHeading} aspects={result.growth} icon={Sprout} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <GlassPanel>
          <h2 className="font-display text-lg text-silver-100">{copy.elementsHeading}</h2>
          <p className="mt-1 text-xs text-silver-500">
            {t.astrologyTerms.elements[a.element]} + {t.astrologyTerms.elements[b.element]}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-silver-300">{result.elements[locale]}</p>
        </GlassPanel>
        <GlassPanel>
          <h2 className="font-display text-lg text-silver-100">{copy.modalitiesHeading}</h2>
          <p className="mt-1 text-xs text-silver-500">
            {t.astrologyTerms.modalities[a.modality]} + {t.astrologyTerms.modalities[b.modality]}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-silver-300">{result.modalities[locale]}</p>
        </GlassPanel>
      </div>

      <GlassPanel className="mt-4">
        <h2 className="font-display text-lg text-silver-100">{copy.adviceHeading}</h2>
        <p className="mt-2 text-sm leading-relaxed text-silver-300">{result.advice[locale]}</p>
      </GlassPanel>

      <GlassPanel className="mt-8 flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold-400/40 bg-gold-500/10 text-gold-300">
          {otherMode === "love" ? <Heart className="h-5 w-5" /> : <Handshake className="h-5 w-5" />}
        </span>
        <div className="flex-1">
          <p className="font-display text-lg text-silver-100">{otherMode === "love" ? copy.otherModeLove : copy.otherModeFriendship}</p>
          <p className="text-sm text-silver-400">
            {t.compatibilityPage.modes[otherMode]}: <span className="text-gold-300">{other.overall}%</span> · {other.verdict[locale]}
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href={compatibilityPath(otherMode, result.first, result.second)}>
            {copy.otherModeCta} <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </GlassPanel>

      <GlassPanel className="mt-10">
        <h2 className="mb-4 text-center font-display text-lg text-silver-100">{copy.anotherPair}</h2>
        <Suspense>
          <CompatibilityPicker mode={result.mode} initialFirst={result.first} initialSecond={result.second} />
        </Suspense>
      </GlassPanel>

      <p className="mt-6 text-center text-xs text-silver-500">
        {copy.method} {copy.note} {t.astrologyPage.disclaimer}
      </p>
      <CompatibilityFooterLinks />
    </div>
  );
}

/** Страница выбора пары: переключатель режима, выбор знаков и подборка самых гармоничных пар. */
export function CompatibilityIndexContent({ mode }: { mode: CompatibilityMode }) {
  const t = useTranslation();
  const { locale } = useLocale();
  const copy = t.compatibilityPage;
  const best = topPairs(mode, 6);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-gold-400">{copy.eyebrow}</p>
        <h1 className="mt-2 font-display text-3xl text-silver-50 sm:text-4xl">
          <SplitWords text={mode === "love" ? copy.title : copy.friendshipTitle} immediate delay={0.1} />
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-silver-400">{mode === "love" ? copy.subtitle : copy.friendshipSubtitle}</p>
      </div>

      <div className="mt-6">
        <CompatibilityModeTabs mode={mode} />
      </div>

      <GlassPanel className="mt-6">
        {/* Suspense нужен из-за useSearchParams: остальная страница собирается статически. */}
        <Suspense>
          <CompatibilityPicker mode={mode} />
        </Suspense>
      </GlassPanel>

      <h2 className="mt-12 text-center font-display text-xl text-silver-100">{copy.popularHeading}</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {best.map((pair) => {
          const a = localizeZodiacSign(requireZodiacSignById(pair.first), locale);
          const b = localizeZodiacSign(requireZodiacSignById(pair.second), locale);
          return (
            <li key={`${pair.first}-${pair.second}`}>
              <Link
                href={compatibilityPath(mode, pair.first, pair.second)}
                className="glass-panel focus-ring flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors hover:border-gold-400/40"
              >
                <span className="font-display text-2xl text-gradient-gold">
                  {asText(a.symbol)}
                  {asText(b.symbol)}
                </span>
                <span className="flex-1 text-sm text-silver-200">
                  {a.name} + {b.name}
                </span>
                <span className="font-display text-xl text-gold-300">{pair.overall}%</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="mt-8 text-center text-xs text-silver-500">{copy.method}</p>
      <CompatibilityFooterLinks />
    </div>
  );
}
