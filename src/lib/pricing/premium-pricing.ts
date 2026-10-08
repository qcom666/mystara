/**
 * Premium (безлимитные расклады, все расклады) — подписка за 300 ₽ в месяц, цена в рублях на всех
 * языках (см. natal-chart-pricing.ts).
 *
 * Цена показана на /pricing, а покупка пока не подключена (нет регулярных платежей): страница
 * об этом сообщает.
 */
export const PREMIUM_PRICE_RUB = 300;

export function getPremiumPrice(): { amount: number; currency: "RUB"; formatted: string } {
  return { amount: PREMIUM_PRICE_RUB, currency: "RUB", formatted: `${PREMIUM_PRICE_RUB} ₽` };
}
