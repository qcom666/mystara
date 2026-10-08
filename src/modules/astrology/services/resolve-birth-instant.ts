import { DateTime } from "luxon";

export interface LocalBirthMoment {
  year: number;
  month: number; // 1–12
  day: number;
  /**
   * Не указывать оба параметра, если точное время неизвестно: вызывающий код берёт местный полдень
   * только чтобы выбрать *какую-то* дату, а `NatalChartInput.hasExactTime` сообщает остальной цепочке,
   * что точность времени суток игнорируется.
   */
  hour?: number;
  minute?: number;
  /**
   * Идентификатор пояса IANA, например «Europe/Moscow»: определяет корректное историческое смещение UTC
   * на эту дату, включая летнее время.
   */
  timezone: string;
}

/**
 * Переводит дату и время рождения в местном (настенном) времени в момент UTC, с которым работает
 * остальная цепочка натальной карты. Идентификатор пояса IANA (а не голое смещение от UTC, которое
 * пользователю пришлось бы искать самому) позволяет luxon применить правильное *историческое*
 * смещение для этой даты, включая старые правила летнего времени, без внешнего сервиса часовых поясов
 * (почему это важно, см. описание модуля cities.data.ts).
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
