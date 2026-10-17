import { NextResponse } from "next/server";
import { PRODUCT_PRICES, enabledProviders, isPaymentProductId, supportsAutoRenew, type PaymentContext } from "@/lib/payments/catalog";

/**
 * Какие способы оплаты доступны покупателю сейчас и сколько они стоят.
 * Параметр `product` выбирает товар (по умолчанию пакет натальных карт, как до появления Premium).
 * Внутри Telegram возвращаются только Звёзды (правило Telegram для цифровых товаров). `autoRenew` отмечает способ,
 * которым товар можно оформить подпиской с автопродлением (Premium Звёздами в Telegram).
 * Секретов в ответе нет: только идентификаторы провайдеров и цены.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const context: PaymentContext = params.get("context") === "telegram" ? "telegram" : "web";
  const requested = params.get("product");
  const product = isPaymentProductId(requested) ? requested : "natal_pack";
  const methods = enabledProviders(process.env, context).map((id) => ({
    id,
    price: PRODUCT_PRICES[product][id],
    ...(supportsAutoRenew(product, id, context) ? { autoRenew: true } : {}),
  }));
  return NextResponse.json({ methods });
}
