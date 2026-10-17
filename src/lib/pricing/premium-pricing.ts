/**
 * Premium (безлимитные расклады, все расклады и одна натальная карта в неделю без списания кредитов):
 * платный период оплачивается заранее. Цена в рублях показывается на всех языках (см.
 * natal-chart-pricing.ts). Длительность периода и недельное окно натальной карты описаны правилами
 * доступа в modules/subscriptions/premium.ts.
 *
 * На сайте оплата разовая: повторная оплата добавляет ещё один период к уже оплаченному. В Telegram Premium можно
 * оформить подпиской Звёздами с автопродлением по той же цене (lib/payments/catalog.ts, supportsAutoRenew).
 */
export const PREMIUM_PRICE_RUB = 300;
/**
 * Цена того же периода в Звёздах Telegram: по тому же курсу, что и у пакета натальных карт
 * (500 ⭐ за 1000 ₽, то есть ползвезды за рубль). Менять только здесь.
 */
export const PREMIUM_PRICE_STARS = 150;

export function getPremiumPrice(): { amount: number; currency: "RUB"; formatted: string } {
  return { amount: PREMIUM_PRICE_RUB, currency: "RUB", formatted: `${PREMIUM_PRICE_RUB} ₽` };
}
