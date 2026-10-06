# TODO

Status legend: `[x]` done this session · `[~]` scaffolded/partial (code exists,
needs live config or follow-up) · `[ ]` not started.

See [PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md) for the reasoning
behind each decision referenced below.

## Phase 1 — Foundation
- [x] Next.js 16 (App Router) + TypeScript (strict) + Tailwind v4 scaffold
- [x] Dependencies: Framer Motion, Zustand, Zod, Prisma, Auth.js v5, bcryptjs, Anthropic SDK, Radix primitives, CVA, Vitest
- [x] Domain-driven folder structure (`modules/`, `components/`, `store/`, `lib/`)
- [x] Design tokens (dark/gold/violet theme) in `globals.css` via Tailwind v4 `@theme`
- [x] Fonts (Cormorant Garamond + Inter via `next/font/google`)
- [x] Hand-authored UI kit (`components/ui`): Button, GlassPanel, Badge, Input, Textarea, Dialog, Tabs, Skeleton
- [x] `PROJECT_ARCHITECTURE.md`, `TODO.md`, `.env.example`

## Phase 2 — Tarot MVP
- [x] Full 78-card domain dataset (22 Major + 56 Minor, structured metadata)
- [x] Spread engine + data (One Card, Three Card, Five Card, Celtic Cross, Love, Career, Yes/No)
- [x] Seeded draw engine (no duplicates, reversed support, reproducible via seed)
- [x] Reading flow state machine (Zustand): spread → question → shuffle → draw → reveal → result
- [x] Card face/back components (procedural SVG art, upright/reversed), deck shuffle + flip animations
- [x] Spread layout system (bespoke layouts + generic fallback grid for new spreads)
- [x] Reading result screen (per-card meanings + AI interpretation panel)
- [ ] Real card artwork (currently procedural SVG by design — see Decision Log #3)

## Phase 3 — AI
- [x] `AIInterpretationProvider` abstraction
- [x] `MockProvider` (deterministic, offline, default)
- [x] `AnthropicProvider` (used automatically when `ANTHROPIC_API_KEY` is set)
- [x] `/api/ai/interpret` route with Zod validation + fallback-to-mock on provider failure
- [ ] Prompt/output quality tuning against real Anthropic API traffic (needs a live key + manual review)
- [ ] Second provider (e.g. OpenAI) — abstraction supports it, not implemented (no requirement yet)

## Phase 4 — Accounts / History
- [x] Prisma schema: `User/Account/Session/VerificationToken` (Auth.js) + `Reading/ReadingCard/AIInterpretation/Favorite/Subscription`
- [x] Auth.js config: Credentials (bcrypt) + Google (conditional on env vars) + JWT sessions
- [x] `/api/readings` (list/create), `/api/readings/[id]` (get/patch-favorite), `/api/favorites`
- [x] Login / signup pages
- [x] Reading history dashboard + reading detail (exact reconstruction from `ReadingCard` rows)
- [ ] **Needs a real `DATABASE_URL`** — schema is migration-ready but no live Postgres instance exists in this environment. Until then, auth/save/history routes return a clear "persistence not configured" error instead of crashing (see Decision Log/§24). Once `DATABASE_URL` is set (in `.env`, read by both `prisma.config.ts` and `src/lib/db.ts`), run:
  ```bash
  npx prisma migrate dev --name init
  ```
- [ ] Email verification flow
- [ ] Password reset flow

## Phase 5 — Monetization Foundation
- [x] `PLAN_POLICIES` + `canStartReading()` pure entitlement function
- [x] `isPremium` flag on spreads; free plan capped at 3 readings/day
- [x] `Subscription` model in schema
- [ ] Real payment provider integration (Stripe recommended — no requirement to implement yet)
- [ ] Billing portal / upgrade UI

## Phase 6 — Telegram
- [x] `initData` HMAC-SHA256 validation (`src/lib/telegram/validate-init-data.ts`), per Telegram's documented algorithm
- [x] `telegram` Credentials provider for Auth.js — finds-or-creates a `User` by `telegramId`, no password
- [x] `TelegramProvider` (`src/components/telegram/`) — loads the WebApp SDK, calls `ready()`/`expand()`, syncs header/background color, auto-signs-in when `initData` is present
- [x] `TelegramBackButton` — native back button synced to the Next.js router, hidden on the home screen
- [x] `TelegramGate` / `TelegramHome` — swaps the marketing landing page for a compact module-picker hub when running inside Telegram; `SiteHeader`/`SiteFooter` hide themselves too (Telegram provides its own chrome)
- [x] `User.telegramId/telegramUsername/telegramPhotoUrl` added to schema; `email` is now optional (Telegram-only users have none)
- [x] Verified end-to-end in-browser with a mocked `window.Telegram.WebApp` (see "Verified this session")
- [ ] **Needs a real bot** — create one via [@BotFather](https://t.me/BotFather) (`/newbot`), set `TELEGRAM_BOT_TOKEN`, register this app's deployed URL as the bot's Mini App. Nothing here can be tested against the real Telegram client without that.
- [x] ~~`MainButton` integration~~ — **removed (Oct 2026, owner's request):** the Mini App now uses the website's gold in-page buttons instead of Telegram's native blue bottom button (`useTelegramMainButton()` and the `!isTelegram` guards are gone). Haptic feedback on shuffle/draw/card-reveal is unchanged.

## Phase 7 — Numerology
- [x] `modules/numerology` domain model + Life Path Number meanings (1–9, 11, 22, 33)
- [x] `calculateLifePathNumber()` — standard digit-sum algorithm, master numbers preserved
- [x] `/numerology` flow (birthdate → result), guest-friendly
- [x] Save-to-history: `/api/numerology` (POST/GET), `NumerologyReading` rows, surfaced on `/readings`
- [x] **Depth pass** (see Decision Log #8, PROJECT_ARCHITECTURE.md §17): `calculateBirthdayNumber()`;
      Pythagorean *and* Chaldean letter-value tables (`domain/letter-values.data.ts`); name-derived
      Expression/Soul Urge/Personality/Maturity numbers computed under both systems
      (`services/calculate-name-numbers.ts`, 8 hand-verified unit tests); result screen shows Life
      Path + Birthday always, plus a Pythagorean/Chaldean tab switcher when a name is given
- [x] Persisting the richer profile — `NumerologyReading` now also stores `birthdayNumber`, `fullName` (when calculable), and all eight Pythagorean/Chaldean name-derived numbers; both systems are saved side by side, so there's no separate "system choice" to persist. `/readings` shows the saved name under the Life Path line. Schema change only — needs `prisma migrate dev` once a real `DATABASE_URL` exists (see Phase 4)

## Phase 8 — Astrology
- [x] ~~`modules/astrology` domain model — **sun sign only**~~ — the full natal chart described here now exists, see Phase 8b below
- [x] `calculateSunSign()` — tropical zodiac date ranges, including the Capricorn year-wraparound
- [x] `/astrology` flow (birthdate → result), same guest-friendly pattern as numerology
- [x] Save-to-history: `/api/astrology` (POST/GET), `AstrologyReading` rows, surfaced on `/readings`
- [x] **Sect** (see Decision Log #8, PROJECT_ARCHITECTURE.md §17): `domain/sect.data.ts` (day/night
      profiles — favored planets, keynote, Mercury note); `AstrologyInputForm` asks Day/Night/Not
      sure directly rather than computing it; result screen shows a Sect section only when known,
      omitted cleanly for "Not sure"
- [x] Persisting sect — `AstrologyReading.sect` (nullable: "day"/"night"/unset for "Not sure"); `/readings` shows it as a badge next to the saved sign

## Phase 8b — Natal Chart (Premium, paid-only) — see PROJECT_ARCHITECTURE.md §17b
- [ ] **⚠️ `NATAL_CHART_FREE_FOR_TESTING = true` in `lib/pricing/natal-chart-pricing.ts` — the entire paywall is currently bypassed on purpose** (requested by the product owner, to try the feature before accounts/payments exist). Anyone can generate a chart for free, unsaved, with no sign-in. Flip that one constant to `false` before real launch — everything else (credits, save, auth) is already wired and unaffected.
- [x] Real ephemeris engine (`modules/astrology/services/ephemeris.ts`, `chart-angles.ts`, `calculate-natal-chart.ts`) using `astronomia` (Meeus/VSOP87) — Sun, Moon, all 7 other planets, Ascendant, Midheaven, whole-sign houses, chart ruler, major aspects with retrograde flags; Pluto omitted outside its series' ~1885–2099 valid range rather than guessed
- [x] Correctness checked three ways (not just read-through): Sun longitude within 2° of the real 2024 equinox/solstice instants; Sun sign agrees with the existing `calculateSunSign()` for 5 spot-check dates; a manual run for 1990-05-14/Moscow reproduced the real Saturn–Uranus–Neptune-in-Capricorn stellium of that era. 60 new unit tests across `ephemeris.test.ts`, `chart-angles.test.ts`, `calculate-natal-chart.test.ts`, `resolve-birth-instant.test.ts`, `natal-chart-interpretation.test.ts`
- [x] No exact birth time → Ascendant/Midheaven/chart ruler/houses are omitted (not guessed), same pattern as sect's "Not sure"; planets/signs/aspects still shown
- [x] Birth place: curated city list (`domain/cities.data.ts`, ~85 cities with verified IANA timezones — no geocoding API called, so no new cross-border data flow) + manual lat/lon/timezone fallback; `resolve-birth-instant.ts` (luxon) resolves local time → UTC using the *historical* offset for that IANA zone (catches things like 1990 Moscow being UTC+4, not today's UTC+3)
- [x] Interpretation text composed from existing building blocks (planet nature + zodiac sign keywords + house theme + aspect meaning) rather than hand-authoring the planet×sign×house combinatorial explosion — same trick as numerology's number-type-framing.ts; plain composed text, not "AI" (consistent with Decision Log #16)
- [x] Pricing & credits: `lib/pricing/natal-chart-pricing.ts` (₽1000 / 3 charts; a manually-set $10 shown for English locale, not a live FX conversion), `User.natalChartCredits`, `NatalChartReading`, `NatalChartPurchase` (Prisma), credit spent + chart saved atomically in one transaction (`spendCreditAndSaveNatalChart`)
- [x] `POST /api/natal-chart` (auth + credits required, resolves birth instant, computes, spends a credit, saves) and `GET /api/natal-chart` (credits + history)
- [x] UI: `NatalChartFlow`/`NatalChartInputForm`/`NatalChartResult`/`NatalChartPricingPanel`; entry points on `/astrology` (teaser), `/pricing` (card), and the top nav (`/astrology/natal-chart`)
- [x] **Payments are built** (code complete, unit-tested, not yet exercised live — no DATABASE_URL / provider keys yet): `lib/payments/` (catalog + Stars/ЮKassa clients), `purchase.repository.ts` (`fulfillPurchase` — idempotent, checks provider/amount/currency), `/api/payments/{methods,checkout,yookassa/webhook}`, Stars via the bot webhook (`pre_checkout_query` + `successful_payment`), and the buy buttons in `NatalChartPricingPanel`. A method switches on by itself when its env vars exist (see `.env.example`)
- [ ] **Telegram rule:** digital goods inside Telegram (bots and Mini Apps) must be paid with Stars only — so Stars are offered ONLY inside the bot / Mini App and cards/SBP (ЮKassa) ONLY on the website (`enabledProviders` in `lib/payments/catalog.ts`). Prices: ⭐500 / ₽1000, Premium ₽300/month — shown in rubles in every language (`lib/pricing/natal-chart-pricing.ts`)
- [ ] To go live: DATABASE_URL (RF Postgres), `YOOKASSA_SHOP_ID`/`YOOKASSA_SECRET_KEY` + HTTP-notification URL in ЮKassa, then set `NATAL_CHART_FREE_FOR_TESTING = false`; test each method with a real small payment, incl. a refund path (`refundStarPayment` for Stars is not implemented yet)
- [ ] Receipts: ЮKassa → "Мой налог" auto-receipts for самозанятый must be enabled in the ЮKassa cabinet; crypto/Stars income and its tax treatment need an accountant/lawyer (accepting digital currency as payment for services in the RF is restricted by 259-ФЗ — the owner has said they handle this)
- [ ] Zero free credits for everyone today (a deliberate product choice, easy to change — e.g. a 1-credit signup bonus — if that's wanted before payments exist)
- [ ] Not exercised against a live database (same limitation as every other persistence feature — no `DATABASE_URL` in this environment); verified via `tsc`/`eslint`/`vitest`/`next build` and a manual script run of the calculation pipeline instead
- [ ] City list is intentionally incomplete — several populous Russian cities were left out because their current IANA timezone wasn't confidently known when this was written (Russia's regional timezone history has changed several times); expand it carefully, one verified city at a time, rather than guessing
- [ ] No detail/history page for a saved Natal Chart yet (same gap Phase 7/8 already have for numerology/astrology — `/readings` doesn't list Natal Chart entries at all yet)
- [ ] ΔT (TT−UT) is treated as zero — a deliberate, documented simplification (see §17b); revisit only if a future use case needs sub-degree accuracy, which astrology-grade output doesn't
- [ ] Flat aspect orbs per type, not varied by planet — a simplification worth revisiting if this becomes a more serious astrology tool rather than a natal-chart teaser

## Cross-module: actor "fun fact"
- [x] `modules/fun-facts` — matches a reading/numerology/astrology result to a real actor sharing the same computed zodiac sign, Life Path Number, or (for Tarot) a hand-curated archetype tag on the drawn Major Arcana card. **Data-based, not photo/facial-recognition** — confirmed with the user as the right call.
- [x] `FunFactCard` wired into: Tarot result screen, `/numerology` result, `/astrology` result
- [x] Framed explicitly as "a playful coincidence, not a real connection" everywhere it appears — this is entertainment content about real (named) people, kept factual (real public birthdates) and non-definitive by design

## Phase 9 — Internationalization (English + Russian)
- [x] `lib/i18n/en.ts` / `ru.ts` — full parallel dictionaries (nav, common actions, reading flow, auth, errors, numerology/astrology page copy, the entire marketing landing page's copy), `ru.ts` typed `const ru: Dictionary` so a missing/extra/misspelled key fails the build instead of silently falling back to English
- [x] `lib/i18n/dictionaries.ts` (locale list/lookup + `formatCardCount`/`formatReadingsPerDay`, both Russian-3-plural-form-aware) and `lib/i18n/language-provider.tsx` (`LanguageProvider`, `useTranslation()`, `useLocale()` — `useSyncExternalStore` over `localStorage`, not `useState`+effect)
- [x] `LanguageSwitcher` (`components/shared/`) — EN/RU pill toggle, wired into `SiteHeader` so it's visible top-right on both desktop and mobile (outside the `md:hidden`/`hidden md:flex` split, next to the hamburger button)
- [x] Migrated every component off the old static `import { t } from "@/lib/i18n"` singleton to `const t = useTranslation();` — ~30 components across marketing, reading flow, auth, numerology, astrology, tarot favorites/detail
- [x] Split `readings/page.tsx`, `readings/[id]/page.tsx`, `favorites/page.tsx` into a server `page.tsx` (auth + Prisma fetch, unchanged) handing serializable data as props to a new client `*View`/`*Content` component (the part that needed `useTranslation()`) — the standard pattern for "server data, client-localized display"; `pricing/page.tsx` similarly split into a thin server page (keeps its `metadata` export) + `PricingContent` client component
- [x] `document.documentElement.lang` kept in sync with the chosen locale
- [x] Card/spread dataset, Life-Path meanings, zodiac + sect text, fun facts and AI interpretations were later translated as well (Decision Log #11 in PROJECT_ARCHITECTURE.md) — see Phase 9b/9c
- [ ] Not wired: `User.language` DB column (locale choice is `localStorage`-only, per-device, not synced to the account) (the Telegram home screen *is* localized now, see Phase 9c)
- [x] **Follow-up fix**: the `/tarot`, `/tarot/cards`, `/tarot/spreads`, `/tarot/how-to-read-tarot` hub/index pages (plus the `[slug]` card/spread detail pages) were missed in the first pass — their own page-level chrome (titles, subtitles, the how-to-read guide's 7 steps, back-links, CTAs) is now translated too, following the same thin-server-page + client-content-component split (these use `generateStaticParams`/`generateMetadata`, which must stay server-side). Card/spread *names* and meanings remain untranslated domain content, unchanged.

## Phase 9b — Card/spread Russian content + card face redesign
- [x] `nameRu`/`descriptionRu` on all 78 cards (22 Major hand-translated with standard Russian tarot names; 56 Minor generated from suit/rank vocabulary — "Тройка Жезлов") and `nameRu`/`descriptionRu` + position `labelRu`/`meaningRu` on all 7 spreads; locale-aware accessors in `deck.ts`/`spreads.data.ts`; every display site switched over (popular spreads, spread picker, reading flow steps, result/history/favorites, card + spread detail pages, position labels under cards, the Premium-locked screen)
- [x] Card face redesign (`tarot-card-face.tsx`): arched window, twilight gradient with gold horizon, numeral cartouche, name plate, corner ornaments, per-card Major Arcana glyphs; court-card rank label localized (ПАЖ/РЫЦАРЬ/КОРОЛЕВА/КОРОЛЬ)
- [x] Fixed two bugs found while verifying visually: hydration mismatch from unrounded computed SVG coordinates, and a degenerate crescent path that drew nothing for The Moon
- [x] Tests: 7 new (every card/spread has Cyrillic Russian text, Russian card names unique, known names, minor-arcana composition, locale accessors) — 58/58 passing
- [x] (was: card meanings/keywords, Life Path/zodiac/sect text, AI text still English — done in Phase 9c)
- [ ] Still English by design: SEO `<title>`/JSON-LD (server-built before the locale is known)
- [ ] Not eyeballed at 375px this session (the pane resized and cleared the emulation) — grid/layout code is unchanged, but worth a manual look at the new card face on a real phone

## Phase 9c — Meanings, AI text, numerology/astrology/fun facts in Russian
- [x] `meaningsRu`/`keywordsRu` for all 78 cards (Major hand-written in `major-arcana.ru.data.ts`, Minor from suit/rank templates); `getCardMeanings`/`getCardKeywords` accessors
- [x] AI interpretation: `locale` in the request schema/route; Mock provider writes Russian from the `*Ru` fields; Anthropic provider gets a language instruction + localized payload; the panel regenerates when the language is switched; the disclaimer line is localized
- [x] Numerology (Life Path meanings, name-number labels, both systems), astrology (12 signs, sect profiles, Mercury note, element/modality/planet terms), actor fun facts, Telegram home — all follow the locale
- [x] **Cyrillic name crash fixed**: a Russian name summed to 0 → undefined meaning. Added Russian letter tables (Pythagorean), Latin transliteration (Chaldean), `hasCalculableLetters` guard, UI note; tests added
- [x] Numerology with a Cyrillic full name verified live on production (Иван Петров, 1990-05-14 → Life Path 11, all six numbers render in Russian, no crash)

## Phase 10 — Legal, privacy & consent (Russian law) — DRAFT, needs a lawyer
- [x] `/privacy` (12-section policy) and `/consent` (separate consent document), RU authoritative + EN translation with a note, version + effective date, both in the sitemap and linked from the footer, Telegram home and every consent checkbox
- [x] Operator details from `NEXT_PUBLIC_OPERATOR_*` env vars with visible `[placeholders]` (dev warning banner); `.env.example` updated
- [x] Discreet "this is not real fortune-telling" disclaimer at the very bottom of the footer (11px muted, legible on purpose), reused on the Telegram consent screen/home
- [x] Consent capture: required checkbox on email sign-up (`acceptPrivacy: z.literal(true)` server-side too), checkbox gating the Google button, Telegram consent screen before the auto-created account (guest mode if declined; leftover session signed out), re-consent link on the Telegram home
- [x] Proof of consent: `User.privacyConsentAt` + `privacyPolicyVersion` (Prisma), written at sign-up or via `ConsentSync` → `POST /api/privacy/consent` (idempotent, current version only); policy version bump re-asks everyone
- [x] Tests: legal content (both languages present/in step for every section, required policy sections, operator placeholders), consent state parsing/versioning, sign-up schema rejects missing consent — 105 total
- [~] **Operator details** (Vercel env `NEXT_PUBLIC_OPERATOR_*`, also in local `.env`): done — name and registration ("физическое лицо, зарегистрированное по месту жительства в РФ", no ИНН supplied — add it if they register as самозанятый/ИП); **still `[placeholders]`: postal address and e-mail**. Reminder scheduled for 28.09.2026 12:00 (MSK) to create a dedicated project e-mail and provide an address; after that set `NEXT_PUBLIC_OPERATOR_EMAIL` / `_ADDRESS` in Vercel + `.env` and redeploy (NEXT_PUBLIC_* is inlined at build time)
- [ ] **Have a lawyer review** both documents and the disclaimer wording before real users; fill the remaining `[…]` items in the policy text (hosting providers, AI provider, RF data-centre location, РКН notification status, log retention)
- [x] Public offer (`/offer`, `lib/legal/offer.ts`, RU authoritative + EN) and contacts/seller details page (`/contacts`), linked from the footer and sitemap; checkout shows an acceptance notice. Prices in the offer are imported from the pricing modules so they cannot drift from the site. **Have the offer reviewed by a lawyer before the first real sale.**
- [x] **Crypto and USD payments removed** (decided with the owner): 259-ФЗ art. 14 forbids accepting digital currency for services *and* publishing an offer to do so, and a Russian resident can't take USD from residents. No crypto/USD provider, no USD prices; the offer says nothing about crypto (a test enforces it). Revisit only with a lawyer's written advice
- [ ] Postal address is optional and hidden while unset (`NEXT_PUBLIC_OPERATOR_ADDRESS`); phone/e-mail come from `NEXT_PUBLIC_OPERATOR_PHONE` / `NEXT_PUBLIC_OPERATOR_EMAIL`
- [ ] **Data localization (152-ФЗ art. 18 ч.5)** — Russian citizens' personal data must be first recorded/stored in a database located in the RF. Vercel + a foreign Postgres does *not* satisfy this. Decide before adding `DATABASE_URL` in production (RF-hosted Postgres, or no persistence for RF users)
- [ ] Roskomnadzor: operator notification (art. 22) and cross-border transfer notice (art. 12) — depends on the decision above and on the AI provider being a foreign one
- [ ] Self-serve account and data deletion / consent withdrawal (today: by e-mail to the operator, as the policy says; 30-day limit)
- [ ] Accounts created before consent capture existed have no consent record (only matters once a real DB has users)
- [ ] Check whether age-18+ marking under 436-ФЗ is needed for the service
- [ ] The privacy policy must be kept in sync with real infrastructure (hosting, DB, AI provider, analytics) — re-read it whenever any of those change

## Deployment
- [x] Live on Vercel: https://taroproject.vercel.app (project `taro_project`, team `qcom666`); public, no deployment protection; env: `AUTH_SECRET`, `TELEGRAM_BOT_TOKEN`, `NEXT_PUBLIC_SITE_URL`
- [x] **Local dev database** (PostgreSQL 16 on the owner's laptop, db `mystara_dev`, role `mystara_app`): installed, migration applied (13 tables), sign-up verified end-to-end (row + consent + bcrypt hash), backup/restore scripts verified — see `db/README.md`. Local only: Vercel/Telegram can't reach it. Hardened: `listen_addresses = localhost` (takes effect after a PostgreSQL/Windows restart), pg_hba allows only 127.0.0.1/::1
- [ ] Production has no `DATABASE_URL` (accounts/history off) — blocked on the localization decision above
- [x] Git repo: private GitHub repo `qcom666/mystara` (branch `main`), CI in `.github/workflows/ci.yml` (typecheck → lint → tests → build)
- [x] Vercel ↔ GitHub linked (project `taro_project` ↔ `qcom666/mystara`, production branch `main`): every push to `main` deploys to production, other branches/PRs get preview URLs. `npx vercel --prod` is now only needed for env-var-only changes

## Pre-launch honesty pass
- [x] Fake testimonials removed from the landing page (component + i18n keys)
- [x] "AI" wording replaced by neutral "interpretation" everywhere public (copy, pricing, FAQ, Telegram home, SEO metadata); the result heading says "AI" only when a real (non-mock) provider produced the text
- [x] Pricing: internal dev note in the billing footnote replaced by a user-facing one; Free price shows "0 ₽" in Russian; Premium already "coming soon" with a disabled button
- [x] Share-preview image (`app/opengraph-image.tsx`)
- [ ] When a real model is connected: restore "AI" wording, update the policy's AI-provider paragraph and the РКН cross-border notice
- [ ] Real testimonials, if/when there are real users to quote

## Not yet done for numerology/astrology (by scope choice, not oversight)
- [ ] Reusing `User.birthDate` (schema field exists, forms don't pre-fill from it or offer to save it yet)
- [x] ~~SEO content pages analogous to `/tarot/cards`, `/tarot/spreads`~~ — done: `/numerology/[number]` and `/astrology/[sign]` exist with `generateStaticParams` (this line was stale)
- [ ] A detail/reconstruction page for a saved numerology or astrology entry (`/readings` lists them inline instead — reasonable given how small the data is, but no dedicated page like `/readings/[id]` exists for them)
- [x] ~~Persisting the numerology depth pass (full name + both systems' numbers) and astrology sect~~ — done, see Phase 7/8 above
- [ ] Real ephemeris-based sect calculation from birth time+place (would let "Not sure" go away entirely) — out of scope alongside the full-natal-chart work already noted for Phase 8

## Fixed in the follow-up bug pass
- [x] **Favorite cards/spreads had no UI** — the `Favorite` model and `/api/favorites` route existed but nothing ever called them. Added `FavoriteButton` (self-contained, session-aware, keeps the SSG card/spread pages static), wired it into `/tarot/cards/[slug]` and `/tarot/spreads/[slug]`, and added a `/favorites` dashboard.
- [x] **Result-screen cards could get stuck mid-flip** — `FlippableCard` always played its flip-in animation on mount, including when a card mounted *already* revealed (result screen, history). Framer Motion's `initial={false}` now makes an already-revealed card snap straight to its final state; only a genuine reveal-by-click still animates.
- [x] **`<button>` nested inside `<button>`** (invalid HTML / React hydration error) on the result screen, where a wrapper button (opens the card-detail dialog) contained `FlippableCard`'s own root `<button>`. `FlippableCard` now renders a plain `<div>` when `interactive={false}`.
- [x] **The card-detail dialog rendered at `position: relative` instead of `fixed`**, off-screen. Root cause: `.noise-overlay` was a plain (unlayered) CSS class setting `position: relative`, and CSS cascade layers always rank unlayered rules above anything in `@layer` — so it silently beat Tailwind's `fixed` utility regardless of class order. Fixed by moving all hand-written utility classes (`.glass-panel`, `.noise-overlay`, `.card-glow`, `.text-gradient-gold`, `.focus-ring`) into `@layer utilities`, and removing `position` from `.noise-overlay` entirely (callers now supply their own position utility).
- [x] Gave the spread-picker cards an explicit `aria-label` (name + lock state) instead of relying on their auto-derived text content.
- [x] **Two `useTelegramMainButton()` hooks alive at once fought over Telegram's single MainButton.** `NumerologyFlow`/`AstrologyFlow` originally held the birthdate form and the result in *one* component with a conditional return — the result's "Save" hook was mounted (just invisible) even while the form's own "Calculate" hook was active, and since the outer component's effect commits after the inner form's, its `hide()` call always won, leaving the MainButton stuck hidden with no way to submit the form at all inside Telegram. Fixed by splitting each into two mutually-exclusive components (`NumerologyResult`/`AstrologyResult`), matching the pattern the Tarot flow's separate step components already used correctly. Caught by directly inspecting the mocked MainButton's `visible` state in-browser, not by reading the UI.

## Verified this session (Telegram pivot + numerology/astrology/fun-facts + MainButton)
- [x] `npx tsc --noEmit`, `npx eslint .` — clean
- [x] `npx vitest run` — 43/43 passing (14 new: Life Path calculation incl. a master-number case, sun-sign boundary dates incl. the Capricorn wraparound and a leap day, actor-match determinism and correctness)
- [x] `npm run build` — 116 routes; `/numerology`, `/astrology` statically generated, `/api/numerology`, `/api/astrology` dynamic
- [x] Numerology flow tested with a known master-number birthdate (2000-09-29 → Life Path 22, verified by hand) and a plain case (1990-01-01 → 3, verified by hand)
- [x] Astrology flow tested with real public birthdates (Emma Watson 1990-04-15 → Aries, fun fact named Anya Taylor-Joy; Zendaya 1996-09-01 → Virgo, fun fact named Keanu Reeves) — both real Aries/Virgo actors, correctly *not* the same person queried
- [x] Tarot fun fact verified against a live draw: The High Priestess → Keanu Reeves (both tagged "sage")
- [x] Telegram MainButton verified end-to-end with a mocked `window.Telegram.WebApp.MainButton` (tracking `setText`/`show`/`hide`/registered handlers, not just reading the DOM): correct label + handler at every Tarot flow step (question → shuffle → reveal → continue → save-or-sign-in), correct label/visibility on numerology and astrology after the component split, in-page fallback buttons confirmed absent throughout, zero console errors
- [x] Telegram context simulated in-browser via a mocked `window.Telegram.WebApp`: header/footer correctly disappear, home hub renders instead of the marketing landing page, `ready()`/`expand()`/theme-color calls fire, `BackButton` shows on sub-pages and hides on the home screen, clicking it calls `router.back()`, and an intentionally-invalid `initData` fails auto-sign-in silently (no console errors, no crash) — confirms the "outside Telegram, nothing changes" and "inside Telegram, chrome adapts" halves both work
- [ ] Not testable here: anything requiring a real Telegram client + bot (can't be verified in this sandbox — see Phase 6)

## Verified this session (numerology/astrology depth: Chaldean/Pythagorean + sect)
- [x] `npx tsc --noEmit`, `npx eslint .` — clean
- [x] `npx vitest run` — 51/51 passing (8 new: name-number calculation, both systems, using "John" as a hand-verified case — Pythagorean Expression 2 vs. Chaldean Expression 9, Soul Urge 6 vs. 7, Personality 5 vs. 11 [master number preserved], Maturity(3,2)=5 and (3,9)=3)
- [x] `npm run build` — clean, 140 routes
- [x] Deleted `components/shared/birth-date-form.tsx` (dead code — both flows now use their own dedicated input forms)
- [x] Astrology sect verified live in-browser (not just unit tests): submitted a birthdate with "Day" selected → Day Chart section rendered with correct title/description/favored planets (Sun, Jupiter, Saturn)/keynote/Mercury note; reset and resubmitted with no sect chosen ("Not sure") → section correctly absent with no layout gap, rest of the result (sign, strengths, fun fact, save prompt) unaffected

## Verified this session (i18n: English/Russian switcher)
- [x] `npx tsc --noEmit`, `npx eslint .`, `npx vitest run` (51/51), `npm run build` (140 routes, `/pricing` still statically prerendered after its server/client split) — all clean
- [x] Fixed a real build-only bug caught by `npm run build` (not `next dev`, not `tsc`): a circular import between `lib/i18n/index.ts` and `language-provider.tsx` threw `ReferenceError: Cannot access 'X' before initialization` during static generation. Fixed by moving the dictionary/locale primitives into their own `lib/i18n/dictionaries.ts` that neither file imports circularly.
- [x] Switcher verified live in-browser: renders top-right on both desktop (1502px) and mobile (375px, next to the hamburger button, menu still opens correctly with translated links) viewports; clicking RU updates the entire visible page instantly with no reload; the choice persists across a full page reload (localStorage)
- [x] Full Russian pass verified live: landing page (hero, live one-card preview, popular spreads incl. correct "3 карты"/"10 карт" pluralization, how-it-works, card showcase, AI showcase, testimonials, FAQ, CTA, footer), login form, a complete Tarot reading (question → shuffle → reveal → result, incl. AI interpretation panel chrome) on One Card and Three Card, numerology (with a full name, both Pythagorean/Chaldean tabs), astrology (with Day sect selected), and the pricing page (incl. "3 расклада в день" pluralization) — all chrome text in Russian, domain content (card/spread/sign/number names, meanings, AI-generated text) correctly left in English per the documented scope line
- [ ] Not exercised live (no `DATABASE_URL` in this environment, same limitation as every prior phase): the authenticated readings-history/favorites dashboards' "ready" branch — verified by `tsc`/`build` only, since the actual data-bearing render path needs a real session + database

## Verified this session (Natal Chart)
- [x] `npx tsc --noEmit`, `npx eslint src`, `npx vitest run` (164/164, 56 new), `npx next build` (154 routes incl. `/astrology/natal-chart` and `/api/natal-chart`) — all clean
- [x] Ephemeris correctness checked against real astronomical facts, not just read-through: Sun longitude within 2° of the true 2024 equinox/solstice instants (4 cases); Sun sign agrees with the existing, independently-implemented `calculateSunSign()` for 5 dates spread across the year; Ascendant/Midheaven formulas reduce to the textbook exact values (MC=0°, Asc=90°) in the zero-obliquity-tilt degenerate case
- [x] Ran the full pipeline manually (outside the test suite) for a real date (1990-05-14, Moscow) and confirmed it reproduces the well-known real Saturn–Uranus–Neptune-in-Capricorn stellium of that era, plus a sensible Ascendant/chart-ruler/aspect list
- [x] `resolve-birth-instant.ts` verified against a real historical timezone fact: 1990 Moscow resolves to UTC+4 (USSR-era seasonal DST), not today's year-round UTC+3 — this was caught *by* the test (an initial wrong expected value assumed the current rule applied retroactively) rather than assumed correct
- [x] Manual browser QA against `next dev`: `/astrology` teaser (price + copy, EN and RU), `/pricing`'s new Natal Chart card, top-nav link, `GET`/`POST /api/natal-chart` fail cleanly with "persistence not configured" when `NATAL_CHART_FREE_FOR_TESTING` is off (no `DATABASE_URL` here) instead of crashing — no console errors
- [x] **With `NATAL_CHART_FREE_FOR_TESTING` on**, clicked through the full form → generate → result path for real (Moscow, 1990-05-14 09:30 local): city picker, hour/minute selects, and the computed chart all rendered correctly — Sun/Mercury in Taurus, Moon/Saturn/Uranus/Neptune in Capricorn (retrograde flags correct), Ascendant in Cancer, a full aspect list, and the "free while testing, not saved" notice instead of the real save-confirmation text
- [ ] Not exercised with the *real* paywall active (`NATAL_CHART_FREE_FOR_TESTING = false`): the authenticated form → generate → result path, credit decrementing, and the 402 "no credits" branch — blocked on the same missing `DATABASE_URL` as every other persistence feature; reviewed by reading the code and unit-testing everything that doesn't touch Prisma directly

## Verified this session (header redesign + moving stars)
- [x] `npx tsc --noEmit`, `npx eslint src`, `npx vitest run` (164/164), `npx next build` — all clean
- [x] Desktop nav (`SiteHeader`) widened and spread out (`gap-8`, wider `max-w-7xl` container, extra `xl:px-8`) — verified with real `getBoundingClientRect()` measurements, not just a screenshot, at 1280/1440px: the earlier `gap-6`/`max-w-6xl` combination was measured to leave **zero** pixels between "Pricing" and "Sign in" once Natal Chart made it a 6-link nav (a real, pre-existing overflow bug, not just a spacing preference) — now ~120px of breathing room at 1280px+
- [x] Nav now switches from the hamburger menu to the inline desktop nav at `xl` (1280px) instead of `md` (768px), since 6 links genuinely don't fit before that regardless of gap size — checked that 1100px correctly still shows the hamburger (with "Sign in" visible next to it) rather than an in-between broken state
- [x] Mobile/tablet dropdown restructured: it now lists only services + pricing; "Sign in" was moved out to a persistent link next to the language switcher, confirmed via `read_page` that it no longer appears inside the opened dropdown
- [x] Stars: each of the 80 stars now drifts along its own path (`--drift-x/y` CSS custom properties + a shared `star-float` keyframe on a wrapper `<div>` per star, twinkle kept on the inner `<span>` so the two `transform`-animations compose instead of one overwriting the other), with bigger/"closer" stars drifting farther and faster than small/"distant" ones for a simple parallax. Verified live via computed `transform` sampled 3s apart — values are genuinely changing, not stuck; `prefers-reduced-motion` still fully disables it via the existing global rule

## Verified in the previous bug-fixing pass
- [x] Manual browser QA against `next dev`: landing page + interactive one-card preview, full reading flow (spread → question → shuffle → draw → reveal → AI interpretation) on One Card/Three Card/Five Card, guest save-prompt, premium-spread gate (Celtic Cross correctly blocked for a guest), login/signup pages, `/readings` redirect-to-login when signed out, signup correctly surfaces "persistence not configured" instead of crashing, SEO card/spread detail pages, sitemap.xml, mobile viewport (375px) with no horizontal overflow, mobile nav menu.
- [ ] Celtic Cross's bespoke cross layout specifically — blocked behind the Premium gate with no live payment provider, so it's only been reviewed by reading the code, not clicked through. Worth a manual pass once Premium is reachable.

### Environment notes for whoever runs this next
- **This project lives inside a OneDrive-synced folder.** OneDrive's background sync touching files under `taro_project/` appears to trigger spurious Next.js Fast Refresh cycles during dev (observed multi-second "Fast Refresh" rebuilds with no source edit behind them). If dev feels sluggish or HMR seems to fire on its own, exclude this folder from OneDrive sync (or move the project outside OneDrive) before assuming it's a code problem.
- **`AUTH_SECRET` is set in a local `.env`** (gitignored) so Auth.js works out of the box in this environment — it's a random local value, safe to regenerate any time with `npx auth secret`.
- **`prisma`/`@prisma/client`/`@prisma/adapter-pg` are pinned to `7.10.0`.** Don't `npm update` these blindly — the `latest` npm tag currently points to a `8.0.0-rc` that replaces the local ORM CLI with a cloud-platform CLI requiring `prisma auth login`. See Decision Log #7 in PROJECT_ARCHITECTURE.md.

## Cross-cutting / not phase-specific
- [x] Landing page (hero, interactive preview, popular spreads, how it works, card showcase, AI showcase, testimonials placeholder, FAQ, CTA, footer)
- [x] SEO: metadata API on all routes, `sitemap.ts`/`robots.ts`, static `/tarot/cards/[slug]` + `/tarot/spreads/[slug]`
- [x] Accessibility: focus states, semantic landmarks, `prefers-reduced-motion` respected in motion components
- [x] Centralized analytics (`lib/analytics.ts`) — console sink today
- [x] i18n — English + Russian, see Phase 9 below
- [x] Unit tests: deck integrity, draw engine (no dupes/reproducibility), spread engine, usage-limit policy, reading reconstruction
- [ ] Component/E2E tests (Playwright) — not started, recommended before real users hit the app
- [x] CI pipeline (typecheck/lint/test/build on push) — GitHub Actions
- [ ] Rate limiting middleware on API routes (usage-limit *policy* exists; a request-level limiter, e.g. Upstash, does not)
- [ ] Structured logging / error monitoring (Sentry or similar)
