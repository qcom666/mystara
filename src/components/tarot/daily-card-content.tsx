"use client";

import { AnimatePresence, motion, useInView, useReducedMotion, useSpring, type TargetAndTransition, type Variants } from "framer-motion";
import { Briefcase, Heart, Hourglass, Send, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import { type PointerEvent, type ReactNode, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Magnetic, ZodiacWheel } from "@/components/motion/effects";
import { EASE_OUT, SpotlightCard, SplitWords } from "@/components/motion/reveal";
import Link from "@/components/shared/localized-link";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useLocale, useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getCardById, getCardKeywords, getCardMeanings, getCardName } from "@/modules/tarot/domain/deck";
import { type DailyCardPayload, moscowDay, msUntilNextMoscowDay } from "@/modules/tarot/services/daily-card";
import { TarotCardBack } from "./tarot-card-back";
import { TarotCardFace } from "./tarot-card-face";

/** idle — колода ждёт касания; shuffling — карты разлетаются веером и собираются; drawing — верхняя карта выходит вперёд. */
type Phase = "idle" | "shuffling" | "drawing" | "revealed";

/** Сколько длится один круг тасования и выход карты. Тасование повторяется, пока не пришёл ответ сервера. */
const SHUFFLE_MS = 1700;
const DRAW_MS = 800;

/** Шесть карт под верхней: в веере они встают по три с каждой стороны от неё. */
const UNDER = [0, 1, 2, 3, 4, 5];
const fanOffset = (index: number) => (index < 3 ? index - 3 : index - 2);

const SPARKS = Array.from({ length: 18 }, (_, index) => index);
const ORBIT = Array.from({ length: 12 }, (_, index) => index);

function subscribeSecond(onChange: () => void) {
  const timer = window.setInterval(onChange, 1000);
  return () => window.clearInterval(timer);
}
const currentSecond = () => Math.floor(Date.now() / 1000);
const noSecond = () => null;

/** Текущая секунда; на сервере и при гидратации null, поэтому разметка совпадает. */
function useSecond(): number | null {
  return useSyncExternalStore(subscribeSecond, currentSecond, noSecond);
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * Цифры как барабаны: в каждом окошке столбик 0–9, который CSS-переходом сдвигается к нужной цифре. Элементы
 * не создаются и не удаляются каждую секунду (у анимаций выхода в фоновой вкладке они копились бы).
 */
function RollingDigits({ text }: { text: string }) {
  return (
    <span className="inline-flex tabular-nums">
      <span className="sr-only">{text}</span>
      {text.split("").map((char, index) =>
        /\d/.test(char) ? (
          <span key={index} aria-hidden="true" className="relative inline-block h-[1.25em] overflow-hidden leading-[1.25em]">
            <span
              className="flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
              style={{ transform: `translateY(-${Number(char) * 10}%)` }}
            >
              {DIGITS.map((digit) => (
                <span key={digit}>{digit}</span>
              ))}
            </span>
          </span>
        ) : (
          <span key={index} aria-hidden="true">
            {char}
          </span>
        ),
      )}
    </span>
  );
}

/**
 * Сколько осталось до новой карты (тикает раз в секунду, поэтому вынесено отдельно: остальная страница не
 * перерисовывается). Когда наступил новый день, а открыта вчерашняя карта, вместо отсчёта предлагает новую.
 */
function NextCardCountdown({ revealedDay, onNewDay }: { revealedDay: string | null; onNewDay: () => void }) {
  const copy = useTranslation().dailyCardPage;
  const second = useSecond();
  const remaining = second === null ? null : msUntilNextMoscowDay(second * 1000);
  const newDay = revealedDay !== null && second !== null && moscowDay(new Date(second * 1000)) !== revealedDay;

  if (newDay) {
    return (
      <motion.button
        type="button"
        onClick={onNewDay}
        className="focus-ring inline-flex items-center gap-2 rounded-full border border-gold-400/50 bg-gold-500/15 px-4 py-2 text-sm text-gold-200 shadow-[0_0_24px_-6px_rgba(212,175,55,0.6)]"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Sparkles className="h-4 w-4" />
        {copy.newDayReady} {copy.openNew}
      </motion.button>
    );
  }

  return (
    <motion.p
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/10 bg-midnight-900/60 px-4 py-2 text-sm text-silver-300",
        remaining === null && "invisible",
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: remaining === null ? 0 : 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.8, ease: EASE_OUT }}
    >
      <Hourglass className="h-4 w-4 text-gold-400 motion-safe:animate-[spin_6s_ease-in-out_infinite]" />
      {copy.nextCardIn}
      <span className="font-medium text-gold-200">
        <RollingDigits text={remaining === null ? "00:00:00" : formatCountdown(remaining)} />
      </span>
    </motion.p>
  );
}

/** Положение карты из-под верхней: в стопке, на круге тасования, улетая вниз при выходе верхней карты. */
function underCardTarget(index: number, phase: Phase): TargetAndTransition {
  const offset = fanOffset(index);
  const stack = { x: offset * 1.5, y: 12 - Math.abs(offset) * 2, rotate: offset * 1.6 };
  if (phase === "idle") return { ...stack, opacity: 1, scale: 1, transition: { duration: 0.5, ease: EASE_OUT } };
  if (phase === "shuffling") {
    const fan = { x: offset * 26, y: Math.abs(offset) * 9 - 26, rotate: offset * 15 };
    return {
      x: [stack.x, fan.x, -fan.x * 0.4, stack.x],
      y: [stack.y, fan.y, stack.y + 8, stack.y],
      rotate: [stack.rotate, fan.rotate, -fan.rotate * 0.35, stack.rotate],
      opacity: 1,
      scale: 1,
      transition: { duration: SHUFFLE_MS / 1000, times: [0, 0.4, 0.72, 1], ease: "easeInOut", repeat: Infinity, delay: Math.abs(offset) * 0.03 },
    };
  }
  return {
    x: offset * 40,
    y: 170 + Math.abs(offset) * 14,
    rotate: offset * 24,
    opacity: 0,
    scale: 0.82,
    transition: { duration: 0.65, ease: [0.55, 0, 0.75, 0.3], delay: (3 - Math.abs(offset)) * 0.04 },
  };
}

/** Верхняя карта: дышит в стопке, подпрыгивает при тасовании, выходит вперёд и потом парит. */
function topCardTarget(phase: Phase): TargetAndTransition {
  if (phase === "idle") return { y: 0, scale: 1, rotate: 0, transition: { duration: 0.5, ease: EASE_OUT } };
  if (phase === "shuffling") {
    return { y: [0, -48, 6, 0], scale: [1, 1.05, 1, 1], rotate: [0, -3, 2, 0], transition: { duration: SHUFFLE_MS / 1000, times: [0, 0.4, 0.72, 1], ease: "easeInOut", repeat: Infinity } };
  }
  if (phase === "drawing") return { y: -24, scale: 1.16, rotate: 0, transition: { type: "spring", stiffness: 120, damping: 14 } };
  return { y: [-24, -36, -24], scale: 1.16, rotate: 0, transition: { y: { duration: 5, ease: "easeInOut", repeat: Infinity } } };
}

/** Вспышка в момент переворота: свет, две ударные волны и разлетающиеся искры. */
function RevealBurst() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20">
      <motion.div
        className="absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,240,190,0.8),rgba(230,195,104,0.28)_35%,transparent_66%)]"
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: [0, 1, 0], scale: [0.3, 1.05, 1.4] }}
        transition={{ duration: 1.1, times: [0, 0.22, 1], ease: "easeOut" }}
      />
      {[0, 0.16].map((delay) => (
        <motion.div
          key={delay}
          className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gold-300/80 shadow-[0_0_30px_rgba(243,218,143,0.5)]"
          initial={{ opacity: 0.9, scale: 0.4 }}
          animate={{ opacity: 0, scale: 2.6 }}
          transition={{ duration: 1.3, delay, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
      {SPARKS.map((index) => {
        const angle = (index / SPARKS.length) * Math.PI * 2 + (index % 2) * 0.17;
        const distance = 150 + (index % 3) * 50;
        const star = index % 3 === 0;
        return (
          <motion.span
            key={index}
            className={cn(
              "absolute left-1/2 top-1/2",
              star ? "-ml-1.5 -mt-2.5 text-sm text-gold-200" : "-ml-[3px] -mt-[3px] h-1.5 w-1.5 rounded-full bg-gold-200 shadow-[0_0_10px_2px_rgba(243,218,143,0.8)]",
            )}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, opacity: 0, scale: 0.3, rotate: star ? 180 : 0 }}
            transition={{ duration: 1 + (index % 3) * 0.25, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
          >
            {star ? "✦" : null}
          </motion.span>
        );
      })}
    </div>
  );
}

const sectionVariants: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.45 } } };
const riseVariants: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: EASE_OUT } },
};
const chipsVariants: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const chipVariants: Variants = {
  hidden: { opacity: 0, scale: 0.4, y: 10 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 320, damping: 16 } },
};
const aspectsVariants: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.14 } } };

interface DailyCardRitualProps {
  /** page — отдельная страница с полным толкованием; home — секция главной: коротко и ссылка на страницу. */
  variant: "page" | "home";
  /** Заголовок над отсчётом и колодой. */
  header: ReactNode;
  botUsername?: string;
}

/**
 * Ритуал «Карты дня». Колода парит и зовёт коснуться; по касанию карты разлетаются веером и тасуются,
 * верхняя выходит вперёд и переворачивается со вспышкой, за ней остаются вращающиеся лучи, а значение
 * проявляется по частям. Карту выбирает сервер (GET /api/tarot/daily-card): у вошедшего — личная, у гостя —
 * общая. При «уменьшить движение» карта открывается сразу. На главной карту спрашиваем, только когда секция
 * подъезжает к экрану, а колода появляется, когда секцию видно.
 */
export function DailyCardRitual({ variant, header, botUsername = "" }: DailyCardRitualProps) {
  const t = useTranslation();
  const copy = t.dailyCardPage;
  const { locale } = useLocale();
  const { data: session, status } = useSession();
  const reduceMotion = useReducedMotion();
  const userId = session?.user?.id ?? null;

  const [payload, setPayload] = useState<DailyCardPayload | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  // Открытая карта не меняется, даже если после входа сервер ответит другой: человек уже её прочитал.
  const [revealed, setRevealed] = useState<DailyCardPayload | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const nearView = useInView(stageRef, { once: true, margin: "400px 0px" });
  const inView = useInView(stageRef, { once: true, amount: 0.35 });
  const active = variant === "page" || nearView;
  const shown = variant === "page" || inView;

  const tiltX = useSpring(0, { stiffness: 150, damping: 15 });
  const tiltY = useSpring(0, { stiffness: 150, damping: 15 });

  // Карта зависит от того, кто смотрит, поэтому ждём сессию и спрашиваем заново после входа (в мини-приложении
  // вход проходит уже после открытия страницы).
  useEffect(() => {
    if (status === "loading" || !active) return;
    const controller = new AbortController();
    fetch("/api/tarot/daily-card", { cache: "no-store", signal: controller.signal })
      .then((response) => (response.ok ? (response.json() as Promise<DailyCardPayload>) : Promise.reject(new Error(`HTTP ${response.status}`))))
      .then((data) => {
        setPayload(data);
        setFailed(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [status, userId, attempt, active]);

  useEffect(() => {
    if (!payload) return;
    if (phase === "shuffling") {
      const timer = window.setTimeout(() => setPhase("drawing"), reduceMotion ? 0 : SHUFFLE_MS);
      return () => window.clearTimeout(timer);
    }
    if (phase === "drawing") {
      const timer = window.setTimeout(() => {
        setRevealed(payload);
        setPhase("revealed");
      }, reduceMotion ? 0 : DRAW_MS);
      return () => window.clearTimeout(timer);
    }
  }, [phase, payload, reduceMotion]);

  const card = revealed ? getCardById(revealed.cardId) : undefined;
  const reversed = revealed?.orientation === "reversed";
  const flipped = phase === "revealed" && card !== undefined;
  const name = card ? getCardName(card, locale) : "";
  const meanings = card ? getCardMeanings(card, locale) : null;

  function start() {
    if (phase !== "idle") return;
    setFailed(false);
    setPhase("shuffling");
  }

  function retry() {
    setFailed(false);
    setPhase("idle");
    setAttempt((value) => value + 1);
  }

  function openNewCard() {
    setRevealed(null);
    setPhase("idle");
    tiltX.set(0);
    tiltY.set(0);
    setAttempt((value) => value + 1);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch" || phase !== "revealed") return;
    const rect = event.currentTarget.getBoundingClientRect();
    tiltY.set(((event.clientX - rect.left) / rect.width - 0.5) * 24);
    tiltX.set(-((event.clientY - rect.top) / rect.height - 0.5) * 24);
  }

  function handlePointerLeave() {
    tiltX.set(0);
    tiltY.set(0);
  }

  const statusText = phase === "idle" ? copy.tapDeck : phase === "shuffling" ? copy.shuffling : copy.drawing;
  const kindNote = revealed?.kind === "telegram" ? copy.telegramNote : revealed?.kind === "account" ? copy.accountNote : copy.guestNote;
  const aspects = meanings
    ? [
        { key: "love", title: copy.aspects.love, text: meanings.love, icon: Heart },
        { key: "career", title: copy.aspects.career, text: meanings.career, icon: Briefcase },
        { key: "spiritual", title: copy.aspects.spiritual, text: meanings.spiritual, icon: Sparkles },
      ]
    : [];

  return (
    <>
      <div className="mx-auto max-w-3xl text-center">
        {header}
        <div className="mt-5 flex min-h-10 items-center justify-center">
          <NextCardCountdown revealedDay={revealed?.day ?? null} onNewDay={openNewCard} />
        </div>
      </div>

      {/* Сцена: круг, орбита и лучи позади, колода в центре. Наклон за курсором — только у открытой карты. */}
      <div
        ref={stageRef}
        className="relative mx-auto mt-2 flex h-[27rem] max-w-3xl items-center justify-center sm:h-[31rem]"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 sm:h-[34rem] sm:w-[34rem]"
          initial={{ opacity: 0, scale: 0.7, rotate: -40 }}
          animate={
            shown
              ? {
                  opacity: phase === "revealed" ? 0.55 : 0.85,
                  scale: phase === "shuffling" ? 1.08 : phase === "revealed" ? 1.15 : 1,
                  rotate: phase === "idle" ? 0 : 120,
                }
              : { opacity: 0, scale: 0.7, rotate: -40 }
          }
          transition={{ duration: phase === "shuffling" ? SHUFFLE_MS / 1000 : 1.4, ease: EASE_OUT }}
        >
          <ZodiacWheel className="relative h-full w-full" />
        </motion.div>

        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 motion-safe:animate-[spin_70s_linear_infinite] sm:h-[28rem] sm:w-[28rem]">
          {ORBIT.map((index) => (
            <span
              key={index}
              className="absolute left-1/2 top-1/2 -ml-1 -mt-1 h-2 w-2 rounded-full bg-gold-200 shadow-[0_0_10px_2px_rgba(243,218,143,0.6)] motion-safe:animate-twinkle"
              style={{ transform: `rotate(${index * 30}deg) translateY(-11.5rem)`, animationDelay: `${index * 0.35}s` }}
            />
          ))}
        </div>

        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-500/25 blur-3xl"
          animate={{ opacity: phase === "revealed" ? [0.6, 1, 0.6] : [0.3, 0.6, 0.3], scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        />

        <AnimatePresence>
          {flipped && (
            <motion.div
              key="rays"
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4, ease: EASE_OUT }}
            >
              <div className="h-full w-full bg-[repeating-conic-gradient(from_0deg,rgba(243,218,143,0.2)_0deg_3deg,transparent_3deg_15deg)] [mask-image:radial-gradient(circle,black_18%,transparent_66%)] motion-safe:animate-[spin_60s_linear_infinite]" />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>{flipped && !reduceMotion && <RevealBurst key={revealed?.day} />}</AnimatePresence>

        {phase === "idle" && !reduceMotion && (
          <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {[0, 1.2].map((delay) => (
              <motion.span
                key={delay}
                className="absolute left-1/2 top-1/2 -ml-32 -mt-32 h-64 w-64 rounded-full border border-gold-400/40"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: [0, 0.7, 0], scale: [0.85, 1.35, 1.6] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay }}
              />
            ))}
          </div>
        )}

        <motion.div
          role="button"
          tabIndex={phase === "idle" ? 0 : -1}
          aria-label={copy.deckLabel}
          aria-disabled={phase !== "idle"}
          onClick={start}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              start();
            }
          }}
          className={cn(
            "focus-ring relative z-10 aspect-[3/5] w-40 rounded-2xl sm:w-48",
            phase === "idle" && "cursor-pointer",
          )}
          initial={{ opacity: 0, y: 60, scale: 0.85 }}
          animate={shown ? { opacity: 1, y: phase === "idle" ? [0, -10, 0] : 0, scale: 1 } : { opacity: 0, y: 60, scale: 0.85 }}
          transition={
            phase === "idle"
              ? { opacity: { duration: 0.8 }, scale: { duration: 0.8, ease: EASE_OUT }, y: { duration: 5, repeat: Infinity, ease: "easeInOut" } }
              : { duration: 0.5, ease: EASE_OUT }
          }
        >
          {UNDER.map((index) => (
            <motion.div
              key={index}
              aria-hidden="true"
              className="absolute inset-0 origin-[50%_140%]"
              style={{ zIndex: index < 3 ? index : 5 - index }}
              initial={false}
              animate={underCardTarget(index, phase === "revealed" ? "drawing" : phase)}
            >
              <TarotCardBack className="h-full w-full drop-shadow-xl" />
            </motion.div>
          ))}

          <motion.div
            className="absolute inset-0 z-10"
            initial={false}
            animate={topCardTarget(phase)}
            whileHover={phase === "idle" ? { y: -16, rotate: -2, scale: 1.03, transition: { duration: 0.3, ease: EASE_OUT } } : undefined}
          >
            {/* Перспектива — в трансформации самого наклона: тогда и наклон, и переворот внутри него выглядят объёмными. */}
            <motion.div className="h-full w-full [transform-style:preserve-3d]" style={{ rotateX: tiltX, rotateY: tiltY, transformPerspective: 1100 }}>
              <motion.div
                className="relative h-full w-full [transform-style:preserve-3d]"
                initial={false}
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="absolute inset-0 [backface-visibility:hidden]">
                  <TarotCardBack label={t.reading.cardBackLabel} className="h-full w-full drop-shadow-2xl" />
                </div>
                {card && (
                  <div className={cn("absolute inset-0 [backface-visibility:hidden]", reversed ? "[transform:rotateY(180deg)_rotate(180deg)]" : "[transform:rotateY(180deg)]")}>
                    <TarotCardFace card={card} orientation={revealed?.orientation} locale={locale} className="card-glow h-full w-full drop-shadow-2xl" />
                  </div>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      <div className="mx-auto -mt-2 flex min-h-12 max-w-3xl flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          {failed && phase !== "revealed" ? (
            <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3">
              <p className="text-sm text-silver-300">{copy.loadError}</p>
              <Button size="sm" variant="secondary" onClick={retry}>
                {copy.retry}
              </Button>
            </motion.div>
          ) : phase !== "revealed" ? (
            <motion.p
              key={phase}
              className={cn("text-sm", phase === "idle" ? "text-shimmer-gold font-medium" : "text-silver-300")}
              initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
            >
              {statusText}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      <p className="sr-only" aria-live="polite">
        {flipped ? copy.revealedAnnouncement.replace("{name}", `${name}${reversed ? ` (${copy.reversed})` : ""}`) : ""}
      </p>

      <AnimatePresence>
        {flipped && card && meanings && (
          <motion.section key={card.id} className="mx-auto max-w-3xl text-center" variants={sectionVariants} initial="hidden" animate="show">
            <motion.p variants={riseVariants} className="text-xs uppercase tracking-[0.2em] text-gold-400">
              {reversed ? copy.reversed : copy.upright}
            </motion.p>
            {variant === "page" ? (
              <motion.h2 variants={riseVariants} className="mt-2 font-display text-4xl sm:text-5xl">
                <span className="text-shimmer-gold">{name}</span>
              </motion.h2>
            ) : (
              <motion.h3 variants={riseVariants} className="mt-2 font-display text-4xl sm:text-5xl">
                <span className="text-shimmer-gold">{name}</span>
              </motion.h3>
            )}

            <motion.ul variants={chipsVariants} className="mt-5 flex flex-wrap justify-center gap-2">
              {getCardKeywords(card, locale).map((keyword) => (
                <motion.li key={keyword} variants={chipVariants} className="rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-sm text-gold-200">
                  {keyword}
                </motion.li>
              ))}
            </motion.ul>

            <motion.div variants={riseVariants} className="mt-8">
              <GlassPanel scrollReveal={false} className="relative overflow-hidden text-left">
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                  <div className="absolute -inset-y-12 -left-1/3 w-1/4 rotate-12 bg-gradient-to-r from-transparent via-gold-300/15 to-transparent motion-safe:animate-panel-sheen" />
                </div>
                <h3 className="font-display text-xl text-gold-300">{copy.meaningTitle}</h3>
                <p className="mt-2 leading-relaxed text-silver-200">{reversed ? meanings.reversed : meanings.upright}</p>
              </GlassPanel>
            </motion.div>

            {variant === "page" && (
              <motion.div variants={aspectsVariants} className="mt-4 grid gap-4 sm:grid-cols-3">
                {aspects.map((aspect) => (
                  <motion.div key={aspect.key} variants={riseVariants}>
                    <SpotlightCard>
                      <GlassPanel scrollReveal={false} className="h-full text-left">
                        <div className="flex items-center gap-2 text-gold-300">
                          <aspect.icon className="h-4 w-4" />
                          <h3 className="font-display text-lg">{aspect.title}</h3>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-silver-300">{aspect.text}</p>
                      </GlassPanel>
                    </SpotlightCard>
                  </motion.div>
                ))}
              </motion.div>
            )}

            <motion.p variants={riseVariants} className="mt-6 text-sm text-silver-500">
              {copy.reflection}
            </motion.p>
            <motion.p variants={riseVariants} className="mt-2 text-sm text-silver-400">
              {kindNote}{" "}
              {revealed?.kind === "guest" && (
                <Link href="/login" className="text-gold-300 underline-offset-4 hover:underline">
                  {copy.guestCta}
                </Link>
              )}
            </motion.p>

            <motion.div variants={riseVariants} className="mt-8 flex flex-wrap justify-center gap-3">
              <Magnetic>
                <Button asChild size="lg" className="shadow-[0_0_40px_-8px_rgba(212,175,55,0.7)]">
                  <Link href={`/tarot/cards/${card.id}`}>{copy.moreAboutCard}</Link>
                </Button>
              </Magnetic>
              <Magnetic>
                <Button asChild size="lg" variant="secondary">
                  {variant === "page" ? <Link href="/reading">{copy.fullReading}</Link> : <Link href="/tarot/card-of-the-day">{copy.fullDayReading}</Link>}
                </Button>
              </Magnetic>
            </motion.div>

            {botUsername && (
              <motion.div variants={riseVariants} className="mt-6">
                <a
                  href={`https://t.me/${botUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring inline-flex items-center gap-2 rounded-full px-2 py-1 text-sm text-gold-300 underline-offset-4 hover:underline"
                >
                  <Send className="h-4 w-4" />
                  {copy.telegramCta}
                </a>
                <p className="mt-1 text-xs text-silver-500">{copy.telegramHint}</p>
              </motion.div>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}

/** Страница «Карта дня»: крупный заголовок, ритуал и полное толкование с аспектами. */
export function DailyCardContent({ botUsername }: { botUsername: string }) {
  const copy = useTranslation().dailyCardPage;
  return (
    <div className="overflow-x-clip px-4 pb-24 pt-14">
      <DailyCardRitual
        variant="page"
        botUsername={botUsername}
        header={
          <>
            <motion.p
              data-reveal
              className="text-xs uppercase tracking-[0.25em] text-gold-400"
              initial={{ opacity: 0, letterSpacing: "0.6em" }}
              animate={{ opacity: 1, letterSpacing: "0.25em" }}
              transition={{ duration: 1, ease: EASE_OUT }}
            >
              {copy.eyebrow}
            </motion.p>
            <h1 className="mt-3 font-display text-4xl text-silver-50 sm:text-5xl">
              <SplitWords text={copy.title} immediate delay={0.15} />{" "}
              <SplitWords text={copy.titleAccent} immediate delay={0.4} wordClassName="text-shimmer-gold" />
            </h1>
            <motion.p
              data-reveal
              className="mx-auto mt-4 max-w-xl text-silver-400"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55, ease: EASE_OUT }}
            >
              {copy.subtitle}
            </motion.p>
          </>
        }
      />
    </div>
  );
}
