"use client";

import { Star } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DeleteAccountSection } from "@/components/account/delete-account-section";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { formatCardCount, useLocale, useTranslation, type Locale } from "@/lib/i18n";
import type { AccountData } from "@/lib/repositories/account.repository";
import { localizeZodiacSign, requireZodiacSignById } from "@/modules/astrology/domain/zodiac-signs.data";
import type { ZodiacSignId } from "@/modules/astrology/domain/types";
import { getCardById, getCardName } from "@/modules/tarot/domain/deck";
import { getSpreadById, getSpreadName } from "@/modules/tarot/domain/spreads.data";

export type AccountTab = "overview" | "history" | "favorites";

export type AccountViewData = { status: "unconfigured" } | { status: "ready"; account: AccountData; isAdmin: boolean; tab: AccountTab };

function formatDate(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function spreadLabel(spreadId: string, locale: Locale): string {
  const spread = getSpreadById(spreadId);
  return spread ? getSpreadName(spread, locale) : spreadId;
}

function zodiacLabel(signId: string, locale: Locale): string {
  try {
    const sign = localizeZodiacSign(requireZodiacSignById(signId as ZodiacSignId), locale);
    return `${sign.symbol} ${sign.name}`;
  } catch {
    return signId;
  }
}

function formatAmount(amount: number, currency: string): string {
  return currency === "XTR" ? `${amount} ⭐` : `${amount} ₽`;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:gap-6">
      <dt className="w-52 shrink-0 text-silver-500">{label}</dt>
      <dd className="min-w-0 break-words text-silver-200">{children}</dd>
    </div>
  );
}

function ReadingList({ readings, locale, t }: { readings: AccountData["readings"]; locale: Locale; t: ReturnType<typeof useTranslation> }) {
  return (
    <ul className="mt-3 space-y-2">
      {readings.map((reading) => (
        <li key={reading.id}>
          <Link href={`/readings/${reading.id}`}>
            <GlassPanel padding="sm" className="flex items-center justify-between gap-3 transition-colors hover:border-gold-400/40">
              <div className="min-w-0">
                <p className="truncate text-sm text-silver-100">{spreadLabel(reading.spreadId, locale)}</p>
                <p className="truncate text-xs text-silver-500">
                  {formatDate(reading.createdAt, locale)} · {formatCardCount(reading.cardCount, locale)}
                  {reading.question ? ` · ${reading.question}` : ""}
                </p>
              </div>
              {reading.isFavorite && <Star className="h-4 w-4 shrink-0 fill-gold-400 text-gold-400" aria-label={t.readingsPage.favoriteBadge} />}
            </GlassPanel>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Личный кабинет: баланс кредитов, срок Premium, покупки, история и избранное. */
export function AccountView({ data }: { data: AccountViewData }) {
  const t = useTranslation();
  const a = t.accountPage;
  const { locale } = useLocale();

  if (data.status === "unconfigured") {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <GlassPanel>
          <h1 className="font-display text-2xl text-silver-100">{a.unavailableTitle}</h1>
          <p className="mt-3 text-sm text-silver-400">{t.readingsPage.dbNotConfiguredBody}</p>
        </GlassPanel>
      </div>
    );
  }

  const { account, isAdmin, tab } = data;
  const tabs: { id: AccountTab; label: string; href: string }[] = [
    { id: "overview", label: a.tabOverview, href: "/account" },
    { id: "history", label: a.tabHistory, href: "/account?tab=history" },
    { id: "favorites", label: a.tabFavorites, href: "/account?tab=favorites" },
  ];

  const productName = (product: string) => (product === "premium_month" ? a.productPremium : a.productNatalPack);
  const statusName = (status: string) => (status === "paid" ? a.statusPaid : status === "pending" ? a.statusPending : a.statusFailed);

  const favoriteCards = account.favoriteCardIds.map((id) => getCardById(id)).filter((card) => card !== undefined);
  const favoriteSpreads = account.favoriteSpreadIds.map((id) => getSpreadById(id)).filter((spread) => spread !== undefined);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-silver-50">{a.title}</h1>
        {isAdmin && (
          <Button asChild variant="secondary" size="sm">
            <Link href="/admin">{a.adminLink}</Link>
          </Button>
        )}
      </div>

      <nav className="mt-6 flex gap-2 border-b border-white/10" aria-label={a.title}>
        {tabs.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            aria-current={tab === item.id ? "page" : undefined}
            className={`-mb-px border-b-2 px-4 py-2 text-sm transition-colors ${
              tab === item.id ? "border-gold-400 text-gold-300" : "border-transparent text-silver-400 hover:text-silver-200"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {tab === "overview" && (
        <div className="mt-8 space-y-8">
          <section>
            <h2 className="font-display text-xl text-silver-100">{a.balanceHeading}</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <GlassPanel>
                <p className="text-xs uppercase tracking-wider text-silver-500">{a.creditsLabel}</p>
                <p className="mt-2 text-4xl font-semibold text-gradient-gold">{account.premium.fullAccess ? "∞" : account.credits}</p>
                <p className="mt-2 text-xs text-silver-500">{account.premium.fullAccess ? a.fullAccessHint : a.creditsHint}</p>
                {!account.premium.fullAccess && (
                  <Button asChild variant="secondary" size="sm" className="mt-4">
                    <Link href="/astrology/natal-chart">{a.buyCreditsCta}</Link>
                  </Button>
                )}
              </GlassPanel>

              <GlassPanel>
                <p className="text-xs uppercase tracking-wider text-silver-500">{a.premiumLabel}</p>
                {account.premium.fullAccess ? (
                  <>
                    <p className="mt-2 font-display text-xl text-gold-300">{a.fullAccessTitle}</p>
                    <p className="mt-1 text-xs text-silver-400">{a.fullAccessHint}</p>
                  </>
                ) : account.premium.active && account.premium.currentPeriodEnd ? (
                  <>
                    <p className="mt-2 font-display text-xl text-gold-300">
                      {a.premiumActiveUntil.replace("{date}", formatDate(account.premium.currentPeriodEnd, locale))}
                    </p>
                    <p className="mt-1 text-xs text-silver-400">{a.premiumDaysLeft.replace("{days}", String(account.premium.daysLeft))}</p>
                    <p className="mt-3 text-xs text-silver-400">
                      {a.freeChartLabel}:{" "}
                      {account.premium.freeChartAvailable || !account.premium.nextFreeChartAt
                        ? a.freeChartReady
                        : a.freeChartNext.replace("{date}", formatDate(account.premium.nextFreeChartAt, locale))}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-2 font-display text-xl text-silver-200">{a.premiumInactive}</p>
                    <p className="mt-1 text-xs text-silver-400">{a.freeChartPremiumOnly}</p>
                  </>
                )}
                {!account.premium.fullAccess && (
                  <Button asChild size="sm" className="mt-4">
                    <Link href="/pricing">{account.premium.active ? a.renewPremiumCta : a.getPremiumCta}</Link>
                  </Button>
                )}
              </GlassPanel>
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl text-silver-100">{a.purchasesHeading}</h2>
            {account.purchases.length === 0 ? (
              <p className="mt-3 text-sm text-silver-400">{a.noPurchases}</p>
            ) : (
              <ul className="mt-3 divide-y divide-white/5 rounded-xl border border-white/10 text-sm">
                {account.purchases.map((purchase) => (
                  <li key={purchase.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                    <div>
                      <p className="text-silver-100">{productName(purchase.product)}</p>
                      <p className="text-xs text-silver-500">{formatDate(purchase.createdAt, locale)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-silver-200">{formatAmount(purchase.amount, purchase.currency)}</span>
                      <Badge variant={purchase.status === "paid" ? "gold" : "violet"}>{statusName(purchase.status)}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="font-display text-xl text-silver-100">{a.profileHeading}</h2>
            <dl className="mt-3 divide-y divide-white/5 rounded-xl border border-white/10 text-sm">
              {account.profile.name && <Row label={a.nameLabel}>{account.profile.name}</Row>}
              {account.profile.email && <Row label={a.emailLabel}>{account.profile.email}</Row>}
              {account.profile.telegramUsername && <Row label={a.telegramLabel}>@{account.profile.telegramUsername}</Row>}
              <Row label={a.registeredLabel}>{formatDate(account.profile.createdAt, locale)}</Row>
              <Row label={a.idLabel}>
                <code className="text-xs text-silver-300">{account.profile.id}</code>
              </Row>
            </dl>
          </section>

          <DeleteAccountSection />
        </div>
      )}

      {tab === "history" && (
        <div className="mt-8 space-y-10">
          <section>
            <h2 className="font-display text-xl text-silver-100">{a.readingsHeading}</h2>
            {account.readings.length === 0 ? (
              <p className="mt-3 text-sm text-silver-400">
                {a.noReadings}{" "}
                <Link href="/reading" className="text-gold-300 hover:underline">
                  {a.startReadingCta}
                </Link>
              </p>
            ) : (
              <>
                <ReadingList readings={account.readings} locale={locale} t={t} />
                <p className="mt-3 text-sm">
                  <Link href="/readings" className="text-gold-300 hover:underline">
                    {a.fullHistoryLink}
                  </Link>
                </p>
              </>
            )}
          </section>

          <section>
            <h2 className="font-display text-xl text-silver-100">{a.natalChartsHeading}</h2>
            {account.natalCharts.length === 0 ? (
              <p className="mt-3 text-sm text-silver-400">
                {a.noNatalCharts}{" "}
                <Link href="/astrology/natal-chart" className="text-gold-300 hover:underline">
                  {a.natalChartCta}
                </Link>
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {account.natalCharts.map((chart) => (
                  <li key={chart.id}>
                    <Link href={`/account/natal-charts/${chart.id}`}>
                      <GlassPanel padding="sm" className="flex items-center justify-between gap-3 transition-colors hover:border-gold-400/40">
                        <div className="min-w-0">
                          <p className="truncate text-sm text-silver-100">{chart.birthPlace ?? t.natalChartPage.title}</p>
                          <p className="text-xs text-silver-500">{formatDate(chart.createdAt, locale)}</p>
                        </div>
                        <Badge variant={chart.source === "credit" ? "violet" : "gold"}>
                          {chart.source === "admin" ? a.sourceAdmin : chart.source === "premium" ? a.sourcePremium : a.sourceCredit}
                        </Badge>
                      </GlassPanel>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {account.numerology.length > 0 && (
            <section>
              <h2 className="font-display text-xl text-silver-100">{a.numerologyHeading}</h2>
              <ul className="mt-3 space-y-2">
                {account.numerology.map((entry) => (
                  <li key={entry.id}>
                    <Link href={`/numerology/${entry.number}`}>
                      <GlassPanel padding="sm" className="flex items-center justify-between gap-3 transition-colors hover:border-gold-400/40">
                        <p className="text-sm text-silver-100">
                          {a.lifePathLabel}: {entry.number}
                          {entry.fullName ? ` · ${entry.fullName}` : ""}
                        </p>
                        <p className="shrink-0 text-xs text-silver-500">{formatDate(entry.createdAt, locale)}</p>
                      </GlassPanel>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {account.astrology.length > 0 && (
            <section>
              <h2 className="font-display text-xl text-silver-100">{a.astrologyHeading}</h2>
              <ul className="mt-3 space-y-2">
                {account.astrology.map((entry) => (
                  <li key={entry.id}>
                    <Link href={`/astrology/${entry.signId}`}>
                      <GlassPanel padding="sm" className="flex items-center justify-between gap-3 transition-colors hover:border-gold-400/40">
                        <p className="text-sm text-silver-100">
                          {zodiacLabel(entry.signId, locale)}
                          {entry.sect ? ` · ${entry.sect === "day" ? a.sectDay : a.sectNight}` : ""}
                        </p>
                        <p className="shrink-0 text-xs text-silver-500">{formatDate(entry.createdAt, locale)}</p>
                      </GlassPanel>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {tab === "favorites" && (
        <div className="mt-8 space-y-10">
          <section>
            <h2 className="font-display text-xl text-silver-100">{a.favoriteReadingsHeading}</h2>
            {account.favoriteReadings.length === 0 ? (
              <p className="mt-3 text-sm text-silver-400">{a.noFavoriteReadings}</p>
            ) : (
              <ReadingList readings={account.favoriteReadings} locale={locale} t={t} />
            )}
          </section>

          <section>
            <h2 className="font-display text-xl text-silver-100">{a.favoriteCardsHeading}</h2>
            {favoriteCards.length === 0 ? (
              <p className="mt-3 text-sm text-silver-400">{a.noFavoriteCards}</p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2">
                {favoriteCards.map((card) => (
                  <li key={card.id}>
                    <Link href={`/tarot/cards/${card.id}`} className="inline-block rounded-full border border-gold-500/30 bg-gold-500/5 px-3 py-1 text-sm text-gold-300 hover:bg-gold-500/10">
                      {getCardName(card, locale)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="font-display text-xl text-silver-100">{a.favoriteSpreadsHeading}</h2>
            {favoriteSpreads.length === 0 ? (
              <p className="mt-3 text-sm text-silver-400">{a.noFavoriteSpreads}</p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2">
                {favoriteSpreads.map((spread) => (
                  <li key={spread.id}>
                    <Link href={`/reading/${spread.id}`} className="inline-block rounded-full border border-gold-500/30 bg-gold-500/5 px-3 py-1 text-sm text-gold-300 hover:bg-gold-500/10">
                      {getSpreadName(spread, locale)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="text-sm">
            <Link href="/favorites" className="text-gold-300 hover:underline">
              {a.allFavoritesLink}
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
