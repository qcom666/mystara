import { ZODIAC_SIGNS } from "../domain/zodiac-signs.data";
import type { ZodiacSign } from "../domain/types";

export function calculateSunSign(birthDate: Date): ZodiacSign {
  const month = birthDate.getMonth() + 1;
  const day = birthDate.getDate();

  for (const sign of ZODIAC_SIGNS) {
    const { startMonth, startDay, endMonth, endDay } = sign.dateRange;
    const afterStart = month > startMonth || (month === startMonth && day >= startDay);
    const beforeEnd = month < endMonth || (month === endMonth && day <= endDay);

    // Козерог переходит границу года (22 декабря → 19 января): startMonth > endMonth, поэтому дата должна
    // удовлетворять одной из границ, а не обеим.
    const wraps = startMonth > endMonth;
    const matches = wraps ? afterStart || beforeEnd : afterStart && beforeEnd;
    if (matches) return sign;
  }

  throw new Error("Could not determine a zodiac sign for the given date.");
}
