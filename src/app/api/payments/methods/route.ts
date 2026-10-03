import { NextResponse } from "next/server";
import { NATAL_CHART_PRICES, enabledProviders, type PaymentContext } from "@/lib/payments/catalog";

/**
 * Which payment methods the buyer can use right now, and what each costs.
 * Inside Telegram only Stars are returned (Telegram's rule for digital goods).
 * Contains no secrets — only provider ids and prices.
 */
export async function GET(request: Request) {
  const context: PaymentContext = new URL(request.url).searchParams.get("context") === "telegram" ? "telegram" : "web";
  const methods = enabledProviders(process.env, context).map((id) => ({ id, price: NATAL_CHART_PRICES[id] }));
  return NextResponse.json({ methods });
}
