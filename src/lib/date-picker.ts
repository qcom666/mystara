/**
 * Чистая логика выбора даты для компонента DatePicker (components/ui/date-picker.tsx). Все даты —
 * целые «год, месяц, день» без часовых поясов: так день не «съезжает» на соседний из-за перевода в UTC.
 * Значение для форм хранится строкой ISO `YYYY-MM-DD`, как у стандартного `<input type="date">`.
 */

export interface YMD {
  year: number;
  /** 1–12 */
  month: number;
  day: number;
}

export type DateLocale = "ru" | "en";

/** Меньшие годы не принимаются: ввод «0001» почти наверняка опечатка. */
export const MIN_YEAR = 1000;
export const MAX_YEAR = 9999;

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function isValidYmd({ year, month, day }: YMD): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (year < MIN_YEAR || year > MAX_YEAR || month < 1 || month > 12 || day < 1) return false;
  return day <= daysInMonth(year, month);
}

/** Строго `YYYY-MM-DD` и существующая дата (30 февраля и 13-й месяц отклоняются). */
export function parseIsoDate(value: string): YMD | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const ymd = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  return isValidYmd(ymd) ? ymd : null;
}

const pad = (value: number, length: number) => String(value).padStart(length, "0");

export function toIsoDate({ year, month, day }: YMD): string {
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
}

export function compareYmd(a: YMD, b: YMD): number {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}

/** Попадает ли дата в допустимые границы (любая из границ может отсутствовать). */
export function isWithinRange(date: YMD, min: YMD | null, max: YMD | null): boolean {
  return (min === null || compareYmd(date, min) >= 0) && (max === null || compareYmd(date, max) <= 0);
}

/** День недели с понедельника: 0 — понедельник, 6 — воскресенье. */
export function weekdayMondayFirst({ year, month, day }: YMD): number {
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
}

export function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (((index % 12) + 12) % 12) + 1 };
}

export interface CalendarCell {
  date: YMD;
  /** false для хвоста предыдущего и начала следующего месяца, которыми добивается сетка. */
  inMonth: boolean;
}

/** 6 недель по 7 дней (42 клетки), неделя с понедельника: высота календаря не прыгает от месяца к месяцу. */
export function buildMonthGrid(year: number, month: number): CalendarCell[] {
  const lead = weekdayMondayFirst({ year, month, day: 1 });
  const previous = addMonths(year, month, -1);
  const next = addMonths(year, month, 1);
  const previousDays = daysInMonth(previous.year, previous.month);
  const days = daysInMonth(year, month);

  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i++) {
    const offset = i - lead + 1;
    if (offset < 1) cells.push({ date: { year: previous.year, month: previous.month, day: previousDays + offset }, inMonth: false });
    else if (offset > days) cells.push({ date: { year: next.year, month: next.month, day: offset - days }, inMonth: false });
    else cells.push({ date: { year, month, day: offset }, inMonth: true });
  }
  return cells;
}

const SEPARATOR: Record<DateLocale, string> = { ru: ".", en: "/" };

export function datePlaceholder(locale: DateLocale): string {
  return locale === "ru" ? "дд.мм.гггг" : "dd/mm/yyyy";
}

/** `2026-10-14` → `14.10.2026` (русский) или `14/10/2026` (английский); пустая строка, если значения нет. */
export function formatDisplayDate(iso: string, locale: DateLocale): string {
  const ymd = parseIsoDate(iso);
  if (!ymd) return "";
  const sep = SEPARATOR[locale];
  return `${pad(ymd.day, 2)}${sep}${pad(ymd.month, 2)}${sep}${pad(ymd.year, 4)}`;
}

/**
 * Превращает набранное в маску `дд.мм.гггг`: остаются только цифры (не больше восьми), разделители
 * добавляются сами. Так человек может печатать подряд «14102026» или с точками как удобно.
 */
export function maskTypedDate(raw: string, locale: DateLocale): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const sep = SEPARATOR[locale];
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter((part) => part.length > 0);
  const text = parts.join(sep);
  // Разделитель появляется сразу после полностью набранной группы, чтобы курсор был готов к следующей.
  return digits.length === 2 || digits.length === 4 ? text + sep : text;
}

/** Полностью набранная существующая дата (день, месяц, год) → ISO; всё остальное (неполный ввод, несуществующий день) → null. */
export function parseTypedDate(text: string): string | null {
  const digits = text.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  const ymd = { day: Number(digits.slice(0, 2)), month: Number(digits.slice(2, 4)), year: Number(digits.slice(4, 8)) };
  return isValidYmd(ymd) ? toIsoDate(ymd) : null;
}

export function todayYmd(now: Date = new Date()): YMD {
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}
