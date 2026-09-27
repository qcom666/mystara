import { DateTime } from "luxon";

export interface LocalBirthMoment {
  year: number;
  month: number; // 1–12
  day: number;
  /** Omit both when the exact time isn't known — the caller falls back to local noon just to pick *a* date; NatalChartInput.hasExactTime tells the rest of the pipeline to ignore time-of-day precision. */
  hour?: number;
  minute?: number;
  /** IANA zone id, e.g. "Europe/Moscow" — resolves the correct historical UTC offset for this date, DST included. */
  timezone: string;
}

/**
 * Converts a birth date/time as told in local wall-clock time to the UTC
 * instant the rest of the natal-chart pipeline works in. Using an IANA zone
 * id (rather than a raw UTC-offset number the user would have to look up
 * themselves) means luxon applies the correct *historical* offset for that
 * date — including old DST rules — with no external timezone-lookup service
 * involved (see cities.data.ts's module doc on why that matters here).
 */
export function resolveBirthInstantUtc(moment: LocalBirthMoment): Date {
  const dt = DateTime.fromObject(
    { year: moment.year, month: moment.month, day: moment.day, hour: moment.hour ?? 12, minute: moment.minute ?? 0 },
    { zone: moment.timezone },
  );
  if (!dt.isValid) {
    throw new Error(`Could not resolve birth instant: ${dt.invalidReason} — ${dt.invalidExplanation}`);
  }
  return dt.toUTC().toJSDate();
}
