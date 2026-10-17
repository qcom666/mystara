"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslation } from "@/lib/i18n";
import type { PaymentProductId, PaymentProviderId, ProviderPrice } from "@/lib/payments/catalog";
import { getTelegramWebApp } from "@/lib/telegram/webapp";

export interface PaymentMethod {
  id: PaymentProviderId;
  price: ProviderPrice;
}

export function formatMethodPrice(price: ProviderPrice): string {
  if (price.currency === "XTR") return `${price.amount} ⭐`;
  return `${price.amount} ₽`;
}

/** true внутри Telegram-бота и мини-приложения: там Звёзды, на сайте ЮKassa. */
export const inTelegram = () => Boolean(getTelegramWebApp()?.initData);

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type PurchaseOutcome = "paid" | "failed" | "pending";

/**
 * Ждёт подтверждения оплаты конкретной покупки: сервер сам проверяет платёж у ЮKassa, а оплату Звёздами
 * подтверждает вебхук бота (/api/payments/confirm). Первые полминуты опрос частый, затем реже, всего около
 * полутора минут; если подтверждения так и нет, возвращается "pending" (оплата будет засчитана позже,
 * при следующем открытии страницы или ежедневной сверкой).
 */
export async function waitForPurchase(purchaseId: string, signal?: { cancelled: boolean }): Promise<PurchaseOutcome> {
  const started = Date.now();
  while (Date.now() - started < 90_000) {
    if (signal?.cancelled) return "pending";
    const response = await fetch("/api/payments/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purchaseId }),
    }).catch(() => null);
    if (response?.ok) {
      const { status } = (await response.json()) as { status: string };
      if (status === "paid") return "paid";
      if (status === "failed" || status === "refunded") return "failed";
    } else if (response && response.status !== 429 && response.status < 500) {
      return "failed";
    }
    await sleep(Date.now() - started < 30_000 ? 1500 : 4000);
  }
  return "pending";
}

/**
 * id покупки из адреса возврата с оплаты картой (`?payment=return&purchase=...`), иначе null. Параметры
 * сразу убираются из адреса: подтверждение запускается один раз, а обновление страницы не повторяет его.
 */
export function takePurchaseFromReturnUrl(): string | null {
  const url = new URL(window.location.href);
  const purchaseId = url.searchParams.get("payment") === "return" ? url.searchParams.get("purchase") : null;
  if (url.searchParams.has("payment") || url.searchParams.has("purchase")) {
    url.searchParams.delete("payment");
    url.searchParams.delete("purchase");
    // null, как в документации Next.js: тогда роутер принимает новый адрес и не вернёт параметры при обновлении.
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }
  return purchaseId;
}

/**
 * После подтверждённой оплаты: перечитать сессию (тариф в ней берётся из базы) и серверные компоненты
 * страницы, чтобы Premium-расклады и баланс открылись сразу, без перезагрузки.
 */
export function useRefreshAfterPayment() {
  const router = useRouter();
  const { update } = useSession();
  return useCallback(async () => {
    await update().catch(() => null);
    router.refresh();
  }, [router, update]);
}

/** Сеттеры состояния и id покупки, которые хук отдаёт обработчику успешной оплаты в Telegram. */
export interface CheckoutControls {
  setBusy: (value: PaymentProviderId | "confirming" | null) => void;
  setMessage: (value: string | null) => void;
  purchaseId: string;
}

/**
 * Оформление покупки одного товара: способы оплаты для места, где находится покупатель (Звёзды Telegram
 * внутри бота и мини-приложения — правило Telegram для цифровых товаров, карта и СБП через ЮKassa на
 * сайте), создание платежа и переход к оплате. Сам перевод денег подтверждает сервер, а не клиент: после
 * оплаты вызывающий код ждёт подтверждения покупки (`waitForPurchase`).
 *
 * `onTelegramPaid` вызывается, когда Telegram сообщил об успешной оплате Звёздами в открытом счёте; ему
 * передаются сеттеры состояния, чтобы показать «подтверждаем оплату» и сообщение об ошибке.
 */
export function useCheckout(product: PaymentProductId, onTelegramPaid: (controls: CheckoutControls) => void) {
  const t = useTranslation();
  const { locale } = useLocale();
  const [methods, setMethods] = useState<PaymentMethod[] | null>(null);
  const [busy, setBusy] = useState<PaymentProviderId | "confirming" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/payments/methods?context=${inTelegram() ? "telegram" : "web"}&product=${product}`)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("failed"))))
      .then((data: { methods: PaymentMethod[] }) => {
        if (!cancelled) setMethods(data.methods);
      })
      .catch(() => {
        if (!cancelled) setMethods([]);
      });
    return () => {
      cancelled = true;
    };
  }, [product]);

  const buy = useCallback(
    async (provider: PaymentProviderId) => {
      setBusy(provider);
      setMessage(null);
      try {
        const response = await fetch("/api/payments/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider, product, locale, context: inTelegram() ? "telegram" : "web" }),
        });
        if (!response.ok) throw new Error("checkout_failed");
        const { url, purchaseId } = (await response.json()) as { url: string; purchaseId: string };

        const telegram = getTelegramWebApp();
        if (provider === "stars" && typeof telegram?.openInvoice === "function") {
          telegram.openInvoice(url, (outcome) => {
            if (outcome === "paid") onTelegramPaid({ setBusy, setMessage, purchaseId });
            else setBusy(null);
          });
          return;
        }
        window.location.assign(url);
      } catch {
        setBusy(null);
        setMessage(t.natalChartPage.checkoutFailed);
      }
    },
    [product, locale, onTelegramPaid, t.natalChartPage.checkoutFailed],
  );

  return { methods, busy, setBusy, message, setMessage, buy };
}
