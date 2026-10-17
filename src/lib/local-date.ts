/**
 * «ГГГГ-ММ-ДД» по местному времени сервера. API сохраняет дату рождения как полночь по местному времени
 * сервера (`new Date("ГГГГ-ММ-ДДT00:00:00")`), поэтому обратное преобразование теми же местными геттерами
 * возвращает ровно ту дату, которую ввёл человек.
 */
export function toLocalYmd(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
