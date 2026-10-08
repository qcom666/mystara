import { NextResponse } from "next/server";
import { NATAL_CHART_PRICES, enabledProviders, type PaymentContext } from "@/lib/payments/catalog";

/**
 * Какие способы оплаты доступны покупателю сейчас и сколько они стоят.
 * Внутри Telegram возвращаются только Звёзды (правило Telegram для цифровых товаров).
 * Секретов в ответе нет: только идентификаторы провайдеров и цены.
 */
export async function GET(request: Request) {
  const context: PaymentContext = new URL(request.url).searchParams.get("context") === "telegram" ? "telegram" : "web";
  const methods = enabledProviders(process.env, context).map((id) => ({ id, price: NATAL_CHART_PRICES[id] }));
  return NextResponse.json({ methods });
}
