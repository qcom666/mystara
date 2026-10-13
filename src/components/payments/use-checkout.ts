"use client";

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

/** Сеттеры состояния, которые хук отдаёт обработчику успешной оплаты в Telegram. */
export interface CheckoutControls {
  setBusy: (value: PaymentProviderId | "confirming" | null) => void;
  setMessage: (value: string | null) => void;
}

/**
 * Оформление покупки одного товара: способы оплаты для места, где находится покупатель (Звёзды Telegram
 * внутри бота и мини-приложения — правило Telegram для цифровых товаров, карта и СБП через ЮKassa на
 * сайте), создание платежа и переход к оплате. Сам перевод денег подтверждает вебхук провайдера, а не
 * клиент: после оплаты вызывающий код опрашивает сервер (см. `onTelegramPaid`).
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
        const { url } = (await response.json()) as { url: string };

        const telegram = getTelegramWebApp();
        if (provider === "stars" && typeof telegram?.openInvoice === "function") {
          telegram.openInvoice(url, (outcome) => {
            if (outcome === "paid") onTelegramPaid({ setBusy, setMessage });
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
