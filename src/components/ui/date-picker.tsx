"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import {
  addMonths,
  buildMonthGrid,
  compareYmd,
  daysInMonth,
  datePlaceholder,
  formatDisplayDate,
  isValidYmd,
  isWithinRange,
  maskTypedDate,
  parseIsoDate,
  parseTypedDate,
  toIsoDate,
  todayYmd,
  type YMD,
} from "@/lib/date-picker";
import { useLocale, useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type View = "days" | "months" | "years";

interface DatePickerProps {
  id: string;
  /** Дата в формате `YYYY-MM-DD` или пустая строка, как у стандартного `<input type="date">`. */
  value: string;
  onChange: (value: string) => void;
  /** Границы тоже в формате `YYYY-MM-DD`. */
  min?: string;
  max?: string;
  required?: boolean;
  className?: string;
}

interface Placement {
  top?: number;
  bottom?: number;
  left: number;
  origin: "top" | "bottom";
}

const PANEL_WIDTH = 320;
const EASE = [0.16, 1, 0.3, 1] as const;

const subscribeNothing = () => () => {};
/** true только в браузере: портал в `document.body` нельзя создавать при серверной отрисовке. */
function useIsClient(): boolean {
  return useSyncExternalStore(subscribeNothing, () => true, () => false);
}

function clampToRange(date: YMD, min: YMD | null, max: YMD | null): YMD {
  if (max && compareYmd(date, max) > 0) return max;
  if (min && compareYmd(date, min) < 0) return min;
  return date;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const navButton =
  "focus-ring flex h-9 w-9 items-center justify-center rounded-full text-silver-300 transition-colors hover:bg-white/5 hover:text-gold-300 disabled:pointer-events-none disabled:opacity-30";

/**
 * Календарь вместо стандартного браузерного выбора даты: в стиле сайта, с плавным появлением, ручным вводом
 * `дд.мм.гггг` и быстрым выбором месяца и года (для дат рождения прокручивать десятилетия по месяцу
 * неудобно). На телефоне панель выезжает снизу, на компьютере раскрывается под полем.
 */
export function DatePicker({ id, value, onChange, min, max, required, className }: DatePickerProps) {
  const t = useTranslation();
  const p = t.datePicker;
  const { locale } = useLocale();
  const reduceMotion = useReducedMotion();
  const isClient = useIsClient();

  const intlLocale = locale === "ru" ? "ru-RU" : "en-GB";
  const minYmd = useMemo(() => (min ? parseIsoDate(min) : null), [min]);
  const maxYmd = useMemo(() => (max ? parseIsoDate(max) : null), [max]);
  const selectedYmd = value ? parseIsoDate(value) : null;
  const today = todayYmd();

  const [text, setText] = useState(() => formatDisplayDate(value, locale));
  const [syncedValue, setSyncedValue] = useState(value);
  const [syncedLocale, setSyncedLocale] = useState(locale);
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [placement, setPlacement] = useState<Placement>({ left: 0, origin: "top" });
  const [view, setView] = useState<View>("days");
  const [cursor, setCursor] = useState({ year: today.year, month: today.month });
  const [focusDay, setFocusDay] = useState<YMD>(today);
  const [yearPage, setYearPage] = useState(Math.floor(today.year / 12) * 12);
  const [direction, setDirection] = useState(1);

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Значение изменилось снаружи (например, форму сбросили): подгоняем текст в поле. Собственные изменения
  // компонента (ввод, выбор в календаре) сразу записывают это же значение в `syncedValue`, поэтому недопечатанная
  // дата не затирается, пока значение остаётся пустым.
  if (value !== syncedValue) {
    setSyncedValue(value);
    setText(formatDisplayDate(value, locale));
  }
  // Язык переключили: переписываем разделители (точки или косые черты), не теряя набранное.
  if (locale !== syncedLocale) {
    setSyncedLocale(locale);
    setText(value ? formatDisplayDate(value, locale) : maskTypedDate(text, locale));
  }

  // Стандартная проверка формы показывает это сообщение, если в поле осталась неполная или недоступная дата.
  const typedIso = parseTypedDate(text);
  const typedYmd = typedIso ? parseIsoDate(typedIso) : null;
  const problem = text === "" ? "" : !typedYmd ? p.invalid : !isWithinRange(typedYmd, minYmd, maxYmd) ? p.outOfRange : "";
  useEffect(() => {
    inputRef.current?.setCustomValidity(problem);
  }, [problem]);

  const placeAndMeasure = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    setSheet(window.matchMedia("(max-width: 639px)").matches);
    const rect = wrapper.getBoundingClientRect();
    const margin = 12;
    const left = Math.min(Math.max(rect.left, margin), Math.max(margin, window.innerWidth - PANEL_WIDTH - margin));
    const below = window.innerHeight - rect.bottom;
    if (below >= 420 || below >= rect.top) setPlacement({ top: rect.bottom + 8, left, origin: "top" });
    else setPlacement({ bottom: window.innerHeight - rect.top + 8, left, origin: "bottom" });
  }, []);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("resize", placeAndMeasure);
    window.addEventListener("scroll", placeAndMeasure, true);
    return () => {
      window.removeEventListener("resize", placeAndMeasure);
      window.removeEventListener("scroll", placeAndMeasure, true);
    };
  }, [open, placeAndMeasure]);

  // Фокус получает день, выбранный стрелками (или «текущий» при открытии). Ставим его в момент появления кнопки,
  // а не отдельным эффектом: после смены месяца новая сетка появляется только когда закончится анимация ухода
  // старой, и эффект срабатывал бы раньше, оставив фокус на странице.
  const focusDayRef = useCallback((element: HTMLButtonElement | null) => {
    element?.focus({ preventScroll: true });
  }, []);

  // Escape закрывает календарь, где бы ни находился фокус.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function openPicker() {
    const start = clampToRange(selectedYmd ?? today, minYmd, maxYmd);
    setCursor({ year: start.year, month: start.month });
    setFocusDay(start);
    setYearPage(Math.floor(start.year / 12) * 12);
    setView("days");
    placeAndMeasure();
    setOpen(true);
  }

  function closePicker(returnFocus = true) {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }

  function commit(date: YMD) {
    const iso = toIsoDate(date);
    setText(formatDisplayDate(iso, locale));
    setSyncedValue(iso);
    onChange(iso);
    closePicker();
  }

  function clear() {
    setText("");
    setSyncedValue("");
    onChange("");
    closePicker();
  }

  function handleInput(raw: string) {
    const grew = raw.length > text.length;
    let masked = maskTypedDate(raw, locale);
    // Удаляя, не возвращаем только что стёртый разделитель: иначе его не получилось бы удалить.
    if (!grew && /[./]$/.test(masked)) masked = masked.slice(0, -1);
    setText(masked);
    const iso = parseTypedDate(masked);
    const ymd = iso ? parseIsoDate(iso) : null;
    const nextValue = iso && ymd && isWithinRange(ymd, minYmd, maxYmd) ? iso : "";
    setSyncedValue(nextValue);
    onChange(nextValue);
  }

  function moveFocus(change: { days?: number; months?: number }) {
    let { year, month, day } = focusDay;
    if (change.months) {
      const moved = addMonths(year, month, change.months);
      year = moved.year;
      month = moved.month;
      day = Math.min(day, daysInMonth(year, month));
    }
    if (change.days) {
      const date = new Date(Date.UTC(year, month - 1, day + change.days));
      year = date.getUTCFullYear();
      month = date.getUTCMonth() + 1;
      day = date.getUTCDate();
    }
    const next = { year, month, day };
    if (!isValidYmd(next) || !isWithinRange(next, minYmd, maxYmd)) return;
    setFocusDay(next);
    if (next.year !== cursor.year || next.month !== cursor.month) {
      setDirection(compareYmd(next, focusDay) > 0 ? 1 : -1);
      setCursor({ year: next.year, month: next.month });
    }
  }

  function onDaysKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step: Record<string, { days?: number; months?: number }> = {
      ArrowLeft: { days: -1 },
      ArrowRight: { days: 1 },
      ArrowUp: { days: -7 },
      ArrowDown: { days: 7 },
      PageUp: { months: event.shiftKey ? -12 : -1 },
      PageDown: { months: event.shiftKey ? 12 : 1 },
    };
    const change = step[event.key];
    if (change) {
      event.preventDefault();
      moveFocus(change);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const weekday = (new Date(Date.UTC(focusDay.year, focusDay.month - 1, focusDay.day)).getUTCDay() + 6) % 7;
      moveFocus({ days: event.key === "Home" ? -weekday : 6 - weekday });
    }
  }

  function onDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab" || !dialogRef.current) return;
    // Фокус остаётся внутри панели, пока она открыта: иначе Tab уходил бы за её пределы.
    const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), [tabindex='0']")].filter((el) => el.tabIndex >= 0);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function changeMonth(delta: number) {
    setDirection(delta);
    const next = addMonths(cursor.year, cursor.month, delta);
    setCursor(next);
    setFocusDay({ ...next, day: Math.min(focusDay.day, daysInMonth(next.year, next.month)) });
  }

  const monthName = (month: number, style: "long" | "short" = "long") =>
    capitalize(new Intl.DateTimeFormat(intlLocale, { month: style, timeZone: "UTC" }).format(new Date(Date.UTC(2000, month - 1, 1))));
  // 1 января 2024 года — понедельник, поэтому подписи идут с понедельника.
  const weekdays = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(intlLocale, { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 1 + i))));

  const yearBlocked = (year: number) => (minYmd !== null && year < minYmd.year) || (maxYmd !== null && year > maxYmd.year);
  const monthBlocked = (year: number, month: number) =>
    (minYmd !== null && (year < minYmd.year || (year === minYmd.year && month < minYmd.month))) ||
    (maxYmd !== null && (year > maxYmd.year || (year === maxYmd.year && month > maxYmd.month)));

  const title =
    view === "days" ? `${monthName(cursor.month)} ${cursor.year}` : view === "months" ? String(cursor.year) : `${yearPage} – ${yearPage + 11}`;

  const prevLabel = view === "days" ? p.previousMonth : view === "months" ? p.previousYear : p.previousYears;
  const nextLabel = view === "days" ? p.nextMonth : view === "months" ? p.nextYear : p.nextYears;

  function step(delta: number) {
    setDirection(delta);
    if (view === "days") changeMonth(delta);
    else if (view === "months") setCursor((current) => ({ ...current, year: Math.min(9999, Math.max(1000, current.year + delta)) }));
    else setYearPage((current) => Math.min(9988, Math.max(1000 - (1000 % 12), current + delta * 12)));
  }

  const todayAllowed = isWithinRange(today, minYmd, maxYmd);
  const motionOff = Boolean(reduceMotion);
  const panelTransition = { duration: motionOff ? 0 : 0.2, ease: EASE };

  const dialog = (
    <AnimatePresence>
      {open && (
        <motion.div
          key="date-backdrop"
          className={cn("fixed inset-0 z-[60]", sheet ? "bg-black/60 backdrop-blur-[2px]" : "bg-transparent")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: motionOff ? 0 : 0.18 }}
          onClick={() => closePicker()}
          aria-hidden
        />
      )}
      {open && (
        <motion.div
          key="date-dialog"
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={p.dialogLabel}
          onKeyDown={onDialogKeyDown}
          className={cn(
            "fixed z-[70] rounded-2xl border border-gold-500/25 bg-midnight-900/95 p-4 shadow-[0_24px_70px_-12px_rgba(0,0,0,0.85)] backdrop-blur-xl",
            sheet ? "inset-x-3 bottom-3 max-h-[85vh] overflow-y-auto" : "w-80",
          )}
          style={sheet ? { transformOrigin: "bottom center" } : { top: placement.top, bottom: placement.bottom, left: placement.left, transformOrigin: `${placement.origin} left` }}
          initial={motionOff ? { opacity: 0 } : sheet ? { opacity: 0, y: 48 } : { opacity: 0, y: placement.origin === "top" ? -8 : 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={motionOff ? { opacity: 0 } : sheet ? { opacity: 0, y: 48 } : { opacity: 0, y: placement.origin === "top" ? -6 : 6, scale: 0.97 }}
          transition={panelTransition}
        >
          <div className="flex items-center justify-between gap-1">
            <button type="button" className={navButton} onClick={() => step(-1)} aria-label={prevLabel}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setView(view === "days" ? "years" : view === "months" ? "years" : "days")}
              aria-label={p.chooseYear}
              className="focus-ring rounded-full px-3 py-1.5 font-display text-lg text-silver-100 transition-colors hover:bg-white/5 hover:text-gold-300"
            >
              {title}
            </button>
            <button type="button" className={navButton} onClick={() => step(1)} aria-label={nextLabel}>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="relative mt-3 min-h-[15.5rem]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${view}-${view === "days" ? `${cursor.year}-${cursor.month}` : view === "months" ? cursor.year : yearPage}`}
                initial={motionOff ? { opacity: 0 } : { opacity: 0, x: direction * 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={motionOff ? { opacity: 0 } : { opacity: 0, x: direction * -18 }}
                transition={{ duration: motionOff ? 0 : 0.14, ease: "easeOut" }}
              >
                {view === "days" && (
                  <div onKeyDown={onDaysKeyDown} role="group" aria-label={title}>
                    <div className="mb-1 grid grid-cols-7 text-center text-[11px] uppercase tracking-wide text-silver-500" aria-hidden>
                      {weekdays.map((weekday) => (
                        <span key={weekday} className="py-1">
                          {weekday}
                        </span>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-y-0.5">
                      {buildMonthGrid(cursor.year, cursor.month).map(({ date, inMonth }) => {
                        const blocked = !isWithinRange(date, minYmd, maxYmd);
                        const selected = selectedYmd !== null && compareYmd(date, selectedYmd) === 0;
                        const isToday = compareYmd(date, today) === 0;
                        const hasFocus = compareYmd(date, focusDay) === 0;
                        return (
                          <button
                            key={toIsoDate(date)}
                            type="button"
                            ref={hasFocus ? focusDayRef : undefined}
                            tabIndex={hasFocus ? 0 : -1}
                            disabled={blocked}
                            aria-pressed={selected}
                            aria-current={isToday ? "date" : undefined}
                            aria-label={new Intl.DateTimeFormat(intlLocale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
                              new Date(Date.UTC(date.year, date.month - 1, date.day)),
                            )}
                            onClick={() => commit(date)}
                            className={cn(
                              "focus-ring mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm transition-colors",
                              selected
                                ? "bg-gradient-to-br from-gold-300 to-gold-600 font-semibold text-midnight-950 shadow-[0_0_18px_-4px_rgba(212,175,55,0.7)]"
                                : inMonth
                                  ? "text-silver-100 hover:bg-white/10"
                                  : "text-silver-500/60 hover:bg-white/5",
                              isToday && !selected && "relative text-gold-200 after:absolute after:bottom-1.5 after:h-1 after:w-1 after:rounded-full after:bg-gold-400",
                              blocked && "pointer-events-none opacity-25",
                            )}
                          >
                            {date.day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {view === "months" && (
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <button
                        key={month}
                        type="button"
                        disabled={monthBlocked(cursor.year, month)}
                        aria-label={`${monthName(month)} ${cursor.year}`}
                        onClick={() => {
                          setDirection(1);
                          setCursor((current) => ({ ...current, month }));
                          setFocusDay((current) => ({ year: cursor.year, month, day: Math.min(current.day, daysInMonth(cursor.year, month)) }));
                          setView("days");
                        }}
                        className={cn(
                          "focus-ring rounded-xl py-3 text-sm transition-colors hover:bg-white/10 disabled:pointer-events-none disabled:opacity-25",
                          selectedYmd && selectedYmd.year === cursor.year && selectedYmd.month === month
                            ? "bg-gold-500/20 text-gold-300"
                            : "text-silver-200",
                        )}
                      >
                        {monthName(month, "short")}
                      </button>
                    ))}
                  </div>
                )}

                {view === "years" && (
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 12 }, (_, i) => yearPage + i).map((year) => (
                      <button
                        key={year}
                        type="button"
                        disabled={yearBlocked(year) || year < 1000 || year > 9999}
                        onClick={() => {
                          setDirection(1);
                          setCursor((current) => ({ ...current, year }));
                          setView("months");
                        }}
                        className={cn(
                          "focus-ring rounded-xl py-3 text-sm transition-colors hover:bg-white/10 disabled:pointer-events-none disabled:opacity-25",
                          year === cursor.year ? "bg-gold-500/20 text-gold-300" : "text-silver-200",
                          year === today.year && year !== cursor.year && "ring-1 ring-gold-400/40",
                        )}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-sm">
            <button type="button" onClick={clear} className="focus-ring rounded-lg px-2 py-1.5 text-silver-400 transition-colors hover:text-gold-300">
              {p.clear}
            </button>
            <button
              type="button"
              disabled={!todayAllowed}
              onClick={() => commit(today)}
              className="focus-ring rounded-lg px-2 py-1.5 text-gold-300 transition-colors hover:text-gold-200 disabled:pointer-events-none disabled:opacity-40"
            >
              {p.today}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <Input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        required={required}
        placeholder={datePlaceholder(locale)}
        value={text}
        onChange={(event) => handleInput(event.target.value)}
        aria-invalid={problem !== ""}
        className="pr-12"
      />
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? closePicker(false) : openPicker())}
        aria-label={p.openCalendar}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="focus-ring absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-gold-400 transition-colors hover:bg-gold-500/10 hover:text-gold-300"
      >
        <CalendarDays className="h-5 w-5" />
      </button>
      {isClient && createPortal(dialog, document.body)}
    </div>
  );
}
