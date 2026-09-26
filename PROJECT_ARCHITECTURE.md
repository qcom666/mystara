# Project Architecture — Mystara (working name: Tarot Platform)

## 1. Product Overview

A premium, mobile-first digital esotericism platform, shipped primarily as a
**Telegram Mini App** (see §16) — the same Next.js app also runs as a
standalone website, one codebase serving both shells. The MVP delivers a
complete interactive Tarot reading experience (spread selection → question →
shuffle → draw → reveal → AI interpretation → save/history), plus numerology
(Life Path Number) and astrology (sun sign) modules with a shared "fun fact"
layer (§18). The architecture is built as a **multi-module platform**: Tarot
was module #1; auth, subscriptions, AI, analytics, and the API layer are
shared infrastructure that numerology, astrology, compatibility, and
horoscope modules plug into without rework — numerology and astrology
already prove this out.

Positioning: *"Get clarity through Tarot, symbolism and personalized AI
interpretation."* Tarot is presented as a tool for reflection, symbolism, and
guided introspection — never as guaranteed prediction, financial/medical/legal
advice. This framing is enforced in copy (landing page, result screens) and in
the AI prompt layer itself (see §8).

## 2. Tech Stack & Rationale

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router), React 19 | SSR/SSG for SEO content pages, RSC for fast landing page, one codebase serves web today and a Telegram Mini App / mobile client later via the same API routes |
| Language | TypeScript (strict) | Type safety across a domain model that will grow (cards, spreads, readings, future modules) |
| Styling | Tailwind CSS v4 + hand-authored design system (`src/components/ui`) | Tailwind v4's CSS-first `@theme` maps cleanly to a custom dark/gold/violet token system; a small hand-rolled Radix + CVA kit gives shadcn-quality primitives without depending on the interactive `shadcn` CLI (avoided deliberately — see Decision Log) |
| Animation | Framer Motion | Card flips, shuffles, page/step transitions; has first-class `useReducedMotion` support for accessibility |
| Client state | Zustand | Used *only* for the in-progress reading flow (spread/question/cards/step) — genuinely cross-component, ephemeral UI state. Everything else uses server data + local component state |
| Validation | Zod | Single source of truth for API input validation, shared between route handlers and (optionally) client forms |
| ORM / DB | Prisma + PostgreSQL | Normalized relational data for accounts, readings, subscriptions; Prisma gives type-safe queries and painless migrations |
| Auth | Auth.js v5 (`next-auth@beta`) + Prisma adapter | Credentials + Google OAuth today, session model designed to extend to a future Telegram `initData` provider |
| AI | Provider-abstracted `AIInterpretationService` (`MockProvider` default, `AnthropicProvider` when `ANTHROPIC_API_KEY` is set) | Frontend and API routes never talk to an LLM SDK directly; swapping/adding providers touches one file |
| Testing | Vitest | Fast, native ESM/TS, no config ceremony; used for domain-logic unit tests (deck, spreads, draw engine, usage limits) |

## 3. Domain-Driven Module Structure

```
src/
  app/                      # Next.js routes (thin — delegate to modules/components)
    (marketing)/            # landing page sections composed here
    reading/                 # spread picker + live reading flow
    readings/                 # history dashboard + reading detail (reconstruction)
    tarot/                    # SEO content: card & spread encyclopedias
    login/, signup/
    api/                      # route handlers: auth, readings, favorites, ai
    sitemap.ts, robots.ts
  modules/
    tarot/
      domain/                 # types, the 78-card dataset, spread definitions — pure data + types, zero UI/DB imports
      services/                # draw-engine, reading (create/reconstruct), spread lookup — pure/deterministic, framework-agnostic
    ai/
      providers/               # mock-provider.ts, anthropic-provider.ts
      ai-interpretation.service.ts   # factory + shared prompt-shaping logic
    users/                    # user-facing types shared between auth & profile UI
    subscriptions/            # plan policy + usage-limit service (pure logic)
    numerology/ astrology/ compatibility/ horoscopes/   # placeholder module folders (README stubs only) — see §17
  components/
    ui/                       # design-system primitives (Button, GlassPanel, Badge, Dialog, Tabs, Input, Skeleton…)
    tarot/                    # card face/back, deck shuffle, spread layout, spread picker
    reading/                  # step components for the live reading flow
    marketing/                # landing page sections
  store/                      # Zustand stores (reading-flow only, for now)
  lib/                        # db client, auth config, rng, analytics, i18n, cn(), zod schemas
prisma/
  schema.prisma
```

**Rule enforced throughout:** `modules/tarot/services` and `modules/ai` contain
zero Next.js/browser imports. They are plain TypeScript that a future Telegram
bot backend, a queue worker, or a test file can import directly. UI components
call these services; they never reimplement drawing/shuffling/interpretation
logic themselves.

## 4. Tarot Domain Model

```ts
type Arcana = "major" | "minor";
type Suit = "wands" | "cups" | "swords" | "pentacles";
type Orientation = "upright" | "reversed";

interface TarotCard {
  id: string;            // stable slug, e.g. "the-fool", "ace-of-cups"
  name: string;
  arcana: Arcana;
  suit: Suit | null;
  number: number;        // 0–21 major; 1–14 minor (11 Page, 12 Knight, 13 Queen, 14 King)
  image: string | null;  // reserved for future real artwork; UI generates a symbolic face when null
  keywords: string[];
  description: string;
  meanings: {
    upright: string; reversed: string;
    love: string; career: string; finance: string; spiritual: string;
    yesNo: "yes" | "no" | "maybe" | "yes-if-cautious";
  };
}
```

All 78 cards are defined as static, type-checked data
(`modules/tarot/domain/major-arcana.data.ts`, `minor-arcana.data.ts`), not
hardcoded inside components, and not stored in Postgres. See Decision Log
(§Decision 1) for why.

## 5. Spread Engine

```ts
interface SpreadPosition { id: string; order: number; label: string; meaning: string; }
interface TarotSpread {
  id: string; name: string; slug: string; description: string;
  cardCount: number; positions: SpreadPosition[];
  category: "general" | "love" | "career" | "decision" | "yes-no";
  difficulty: "beginner" | "intermediate" | "advanced";
  isPremium: boolean;
}
```

Spreads are data (`modules/tarot/domain/spreads.data.ts`). Shipped with the MVP:
One Card, Three Card (Past/Present/Future), Five Card
(Situation/Challenge/Root/Advice/Outcome), Celtic Cross (10 cards), Love (5),
Career (4), Yes/No (1). **Adding a spread never touches engine code** — the
draw engine reads `cardCount`/`positions` generically. Layout components look
up a bespoke visual arrangement by `spread.id` and fall back to a generic
responsive grid for any spread that doesn't have one, so a brand-new spread
renders correctly with zero UI changes.

## 6. Card Draw Engine (`modules/tarot/services/draw-engine.ts`)

- `createFullDeck()` — returns all 78 cards in a fixed order (pure function over domain data).
- Seeded RNG (`lib/rng.ts`, mulberry32 + FNV-1a string hashing) — **no `Math.random()`
  in domain logic**.
- `drawForSpread(spread, { seed? })`:
  1. `seed = seed ?? generateSeed()` (random seed generated only at the moment a *new* reading starts).
  2. Fisher–Yates shuffle of the full 78-card deck using the seeded RNG.
  3. Take the first `spread.cardCount` cards — duplicates are **structurally impossible** (no-replacement draw from a shuffled array, not independent random picks).
  4. Roll orientation per card (30% reversed probability, traditional convention) using the same RNG stream.
  5. Zip drawn cards to `spread.positions` in order.
  6. Return `{ seed, cards: DrawnCard[] }`.
- Reproducibility: calling `drawForSpread(spread, { seed })` again with the same seed reproduces the identical shuffle+orientations. This is used for share-preview/debug purposes.
- **Persisted readings do not replay the RNG to render.** `ReadingCard` rows store
  the resolved `cardId` + `positionId` + `orientation` explicitly at draw time.
  A saved reading always renders from those rows, not from re-running the
  algorithm — so a future change to shuffle logic can never alter the meaning
  of a historical reading. The `seed` is stored alongside purely as provenance.

## 7. Reading Lifecycle

1. Client calls `drawForSpread` (runs entirely in-browser — no server round trip needed to draw cards; keeps the experience instant).
2. On completion, the client has `{ seed, spreadId, question, cards[] }`.
3. If the user is authenticated, the client POSTs to `/api/readings` → Zod validation → `reading.service.createReading()` persists `Reading` + `ReadingCard[]` rows.
4. Guests can complete a full reading (it's the core acquisition/demo loop) but are prompted to sign in to save it — nothing is silently lost; the finished reading stays in the Zustand store/URL state until they either save or navigate away.
5. `/readings/[id]` reconstructs a saved reading by reading `Reading` + `ReadingCard` rows and re-hydrating each `cardId` against the static card dataset (no DB read of card content — see §Decision 1).

## 8. AI Interpretation Architecture

```ts
interface AIInterpretationProvider {
  readonly id: string;
  generate(request: AIInterpretationRequest): Promise<AIInterpretationResult>;
}
```

- `MockProvider` — deterministic, offline, zero config. Composes real card
  meaning fields (choosing love/career/finance/spiritual/upright/reversed based
  on keywords in the user's question) into hedged, non-predictive language. This
  is the **default** provider, so the product is fully demoable without any API
  key.
- `AnthropicProvider` — calls `@anthropic-ai/sdk` server-side only, requests a
  strict JSON response (parsed + validated with Zod before it ever reaches the
  client), model configurable via `ANTHROPIC_MODEL` (default `claude-sonnet-5`).
  The system prompt hard-codes the "reflection, not prediction" framing and
  bans absolute/guaranteed-outcome language (financial, medical, legal).
- `getAIInterpretationService()` factory picks Anthropic if `ANTHROPIC_API_KEY`
  is set, else Mock. **Called only from `/api/ai/interpret`** — the API key
  never reaches client bundles.
- If the provider throws (timeout, bad response, rate limit), the route catches
  it and falls back to the Mock provider for that request rather than failing
  the whole reading — the user still gets an interpretation, just not the LLM
  one (see §24 Error Handling).

## 9. Authentication

Auth.js v5, JWT session strategy (required for the Credentials provider),
Prisma adapter for account/session persistence. Providers:
- Credentials (email + bcrypt-hashed password)
- Google OAuth (only registered when `GOOGLE_CLIENT_ID`/`SECRET` env vars are
  present, so the app doesn't crash in environments that haven't configured it)
- Reserved slot: a future `TelegramProvider` validating Telegram
  `initData` HMAC — the session/JWT shape already carries a provider-agnostic
  `userId`, so the rest of the app (readings, favorites, subscriptions) needs
  zero changes when Telegram auth lands.

`session.user` carries `id` and `planTier` (denormalized onto the JWT at sign-in
so entitlement checks don't require a DB round trip on every request).

## 10. Database Schema (Postgres via Prisma)

Auth.js standard models: `User`, `Account`, `Session`, `VerificationToken`.

Product models:
- `Reading` (id, userId, spreadId *[string, references static spread data]*, question, seed, isFavorite, createdAt) → has many `ReadingCard`, has one `AIInterpretation`
- `ReadingCard` (readingId, cardId *[string]*, positionId *[string]*, orientation enum, order)
- `AIInterpretation` (readingId unique, provider, summary, overall, themes[], advice[], challenges[], cardInterpretations Json, generatedAt)
- `Favorite` (userId, type enum `CARD`|`SPREAD`, targetId string, createdAt) — one generic table instead of two, since "favorite card" and "favorite spread" are the same shape
- `Subscription` (userId unique, tier enum `FREE`|`PREMIUM`, status enum, provider, externalId, currentPeriodEnd)

Daily free-tier usage is derived by counting `Reading` rows for the current
user within the current day — no separate `UsageEvent` table needed.

### Future entities (not created yet — documented so the schema story is clear)
`NumerologyProfile`, `AstrologyProfile`, `BirthChart`, `CompatibilityReading`,
`DailyHoroscope`, `Notification`, `Payment`, all following the same
"module owns its tables, shares `User`" pattern as Tarot.

## 11. API Design

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | Auth.js handlers |
| `/api/readings` | GET | List current user's readings (paginated) |
| `/api/readings` | POST | Create/save a reading (Zod-validated) |
| `/api/readings/[id]` | GET | Fetch one reading (ownership-checked) |
| `/api/readings/[id]` | PATCH | Toggle favorite |
| `/api/favorites` | POST/DELETE | Favorite/unfavorite a card or spread |
| `/api/ai/interpret` | POST | Server-side AI interpretation for a drawn (not-yet-saved or saved) reading |

Every mutating route: Zod-validates the body, re-derives the acting user from
the server session (never trusts a client-supplied `userId`), and checks
resource ownership before returning/mutating a `Reading`.

## 12. Usage Limits / Monetization Hooks

`modules/subscriptions/usage-limit.service.ts` exposes a pure function:

```ts
canStartReading({ planTier, spread, readingsToday }): { allowed: boolean; reason?: string }
```

driven by a `PLAN_POLICIES` table (`free`: 3 readings/day, no premium spreads;
`premium`: unlimited, all spreads). Spread data already carries `isPremium`.
Adding Stripe later means: populate `Subscription`, keep this function's
signature — no Tarot/reading code changes.

## 13. Analytics

`lib/analytics.ts` exports a single `track(event, payload)` call with a typed
event union (`landing_viewed`, `spread_selected`, `reading_started`,
`card_drawn`, `reading_completed`, `ai_interpretation_requested`,
`reading_saved`, `subscription_started`, …). Implementation today: console-log
in development, no-op sink otherwise — swapping in PostHog/Segment/GA later is
a one-file change; call sites never change.

## 14. Internationalization

Two locales ship today — English and Russian — with a UI switcher (top-right
of `SiteHeader`, visible at every breakpoint) that changes the whole site
instantly, no page reload or route change.

- **`lib/i18n/en.ts` / `ru.ts`**: parallel string dictionaries covering
  product chrome — nav, forms, the reading flow, auth, errors, numerology/
  astrology page copy — and the marketing landing page's own copy (headings,
  CTAs, FAQ, testimonials, footer). `Dictionary` (`typeof en`, deliberately
  *not* `as const`) is the shared shape: `ru.ts` is typed `const ru:
  Dictionary`, so a missing, extra, or misspelled key fails `tsc`, not a
  silent runtime fallback to English.
- **`lib/i18n/dictionaries.ts`**: `getDictionary(locale)`, `locales`,
  `defaultLocale`, plus small formatting helpers (`formatCardCount`,
  `formatReadingsPerDay`) that apply Russian's three plural forms (1 карта /
  2–4 карты / 5+ карт) where English only needs two.
- **`lib/i18n/language-provider.tsx`**: `LanguageProvider` + `useTranslation()`
  + `useLocale()`. Locale state is read via `useSyncExternalStore` over
  `localStorage` (not `useState`+effect — avoids a setState-in-effect and
  gets cross-tab sync for free from the `storage` event, plus a `window`
  custom event for same-tab updates) — deliberately client-only, not the
  `User.language` DB column, so it works instantly for guests with no request
  round trip. **This file must import its dictionary primitives from
  `./dictionaries`, never from `./index`** — `index.ts` re-exports *from*
  `language-provider.tsx`, so the reverse import is a circular ESM dependency
  that built fine under `next dev` but broke `next build` with `ReferenceError:
  Cannot access 'X' before initialization` (a real incident this session,
  fixed by splitting the pure dictionary logic into its own file).
- **Every component that shows user-facing text is a Client Component**
  calling `const t = useTranslation();` — the old static `import { t } from
  "@/lib/i18n"` singleton is gone. A handful of Server Components that render
  translatable text alongside server-only data (the readings history,
  favorites, and reading-detail pages, which call `auth()`/Prisma) keep their
  data-fetching in `page.tsx` and hand the fetched data as props to a small
  client "View" component that does the actual rendering — the standard
  Next.js split for "server data, client-localized display."
- **Domain content lives next to its English, not in the chrome
  dictionary.** Tarot card `name`/`description` and spread
  `name`/`description`/position `label`/`meaning` each carry a `*Ru`
  sibling field directly on the data (`TarotCard.nameRu`, `TarotSpread.nameRu`,
  `SpreadPosition.labelRu`, …), required by the types so a new card or spread
  can't ship without one. Components read them through locale-aware accessors
  (`getCardName`, `getCardDescription` in `deck.ts`; `getSpreadName`,
  `getSpreadDescription`, `getPositionLabel`, `getPositionMeaning` in
  `spreads.data.ts`) that take a plain `"en" | "ru"` — deliberately not
  `Locale` from `lib/i18n`, so `modules/tarot` stays free of app/UI imports.
  The 22 Major Arcana are hand-translated (standard Russian tarot names:
  Шут, Верховная Жрица, Колесо Фортуны…). The 56 Minor Arcana are *generated*
  like their English counterparts: `"{rank} {suit in genitive plural}"` for
  names (Тройка Жезлов), and a description template whose grammatical subject
  is always «Карта …», which sidesteps Russian gender agreement across the
  rank nouns. Unit tests assert every card/spread has Cyrillic-only Russian
  text and that Russian card names are unique.
- **Meanings, keywords and generated text are translated too.** Card
  `meanings`/`keywords` (`meaningsRu`/`keywordsRu`; Major in
  `major-arcana.ru.data.ts`, Minor via the same suit/rank templates), Life
  Path meanings (`getLifePathMeaning(number, locale)`), zodiac signs
  (`localizeZodiacSign`), sect profiles (`localizeSectProfile`), actor names
  and fun-fact sentences, and the Telegram home screen all follow the locale.
  AI interpretations carry `locale` in the request: the Mock provider composes
  Russian text from the `*Ru` fields, the Anthropic provider gets a language
  instruction plus a localized payload, and the panel regenerates when the
  user switches language (`aiResultLocale` in the reading-flow store).
- **Cyrillic names in numerology.** Pythagorean uses the Russian letter table
  (index % 9 + 1 over the 33 letters, Ё distinct); Chaldean transliterates to
  Latin first. `hasCalculableLetters` guards the "no usable letters → sum 0 →
  undefined meaning" crash a Cyrillic name used to cause; the UI shows a note
  that Chaldean is computed from the transliteration.
- **Still English by design:** server-generated SEO metadata (`<title>`,
  JSON-LD) — it's built before any client-side locale is knowable. Fixed
  domain vocabularies are localized through `astrologyTerms`. See Decision
  Log §9 and §11.
- Adding a third locale is: add `lib/i18n/xx.ts` typed `const xx: Dictionary`
  (the compiler enforces full coverage), add it to `dictionaries.ts`'s
  `dictionaries` map and `locales` array, done — no component changes.

## 14b. Legal, Privacy & Consent (Russian law focus)

> **Status: drafted, not lawyer-reviewed.** The texts are a solid working draft
> built around 152-ФЗ, not legal advice. See TODO.md "Legal" for what must
> happen before a real public launch.

**Documents** (`lib/legal/`, rendered by `components/legal/legal-document-view.tsx`
at `/privacy` and `/consent`, both linked from the footer, Telegram home and
every consent checkbox):
- `privacy-policy.ts` — 12 sections (general, operator, nature of the service,
  data collected, purposes, processing, cross-border transfer, cookies,
  retention, rights, children, changes). Russian is the authoritative text;
  the English version carries a "translation, no independent force" note.
- `consent.ts` — the **separate** consent document (152-ФЗ art. 9 requires
  consent to be a stand-alone act, not buried in terms): who, purposes, data,
  actions, recipients incl. cross-border, term and how to withdraw.
- `operator.ts` — operator identity from `NEXT_PUBLIC_OPERATOR_NAME/
  REGISTRATION/ADDRESS/EMAIL`. Unset values render as obvious `[placeholders]`
  (a dev-only banner warns) rather than invented details. `PRIVACY_POLICY_VERSION`
  is bumped on any material text change.

**Consent capture** — unticked checkbox, never pre-selected, never bundled:
| Door | Behaviour |
|---|---|
| Email sign-up | Required checkbox; `signupSchema.acceptPrivacy` is `z.literal(true)`; the route stores `privacyConsentAt` + `privacyPolicyVersion` on `User` |
| Google | Checkbox gates the button (the first sign-in creates the account) |
| Telegram | `TelegramConsentGate` blocks the app until a choice is made; auto sign-in in `TelegramProvider` waits for `accepted`. "Continue without an account" = guest mode, nothing saved; a leftover session is signed out. Home has "sign in and save my history" to change one's mind |
| Email login | No checkbox — existing account, consent was given at sign-up |

Device-side state (`use-privacy-consent.ts`) is `accepted|declined:<policy version>`
in localStorage (with an in-memory mirror if storage is blocked); a version
bump reads back as "unknown" and asks again. It is a UX cache — the auditable
record is the DB row, written by sign-up directly or by `ConsentSync` →
`POST /api/privacy/consent` (auth required, idempotent per version, only the
*current* version is accepted).

**Footer disclaimer** ("not real fortune-telling", entertainment/reflection
only, not medical/psychological/legal/financial advice): at the very bottom
under the footer, `text-[11px]` in muted silver — deliberately fine print, but
real text at legible contrast. An invisible disclaimer would undermine its own
purpose (and RF consumer law expects information to be accessible), so it is
discreet, not hidden. Also shown on the Telegram consent screen and home.

**Known gaps** (tracked in TODO.md): data-localization (art. 18 ч.5 — Russian
citizens' data must be first recorded in an RF database; Vercel + a foreign DB
does not satisfy this), Roskomnadzor notifications (art. 22 operator, art. 12
cross-border), no self-serve account/data deletion, no consent record for
accounts created before this feature, policy text must match real infrastructure.

## 15. SEO

Static/dynamic metadata via the Next.js Metadata API on every route,
`sitemap.ts`/`robots.ts` generated from the same domain data that drives the
UI (every card and spread automatically gets a sitemap entry), semantic HTML,
and statically-generated `/tarot/cards/[slug]` + `/tarot/spreads/[slug]` pages
(`generateStaticParams` over the 78 cards / spread list).

## 16. Telegram Mini App

The product now runs primarily as a Telegram Mini App, with the same Next.js
app also serving as a regular website (one codebase, two shells) — exactly
what the API-first, framework-agnostic domain layer from day one was for.

- **SDK (`src/lib/telegram/`):** hand-written types for the subset of the
  Telegram WebApp JS API actually used, rather than pulling in a wrapper
  package — the surface is small and this keeps full control over what loads.
- **`TelegramProvider`** (`src/components/telegram/telegram-provider.tsx`)
  loads `telegram-web-app.js` via `next/script`, calls `ready()`/`expand()`,
  syncs Telegram's native header/background color to our theme, and —
  when `initData` is present — signs the user in automatically. Outside
  Telegram, `webApp` stays `null` and the app behaves exactly as before.
- **Auth:** a `telegram` Credentials provider (`src/lib/auth.ts`) takes the
  raw `initData` string the client already has (`window.Telegram.WebApp.initData`)
  and validates it server-side via `validateTelegramInitData()`
  (`src/lib/telegram/validate-init-data.ts`), which reimplements Telegram's
  documented HMAC-SHA256 check against `TELEGRAM_BOT_TOKEN`. This is the
  *only* thing that proves a client-supplied `initData` actually came from
  Telegram — the route never trusts it otherwise. On success it finds-or-creates
  a `User` by `telegramId` (no password; the signature *is* the credential).
- **Chrome:** `SiteHeader`/`SiteFooter` render `null` inside Telegram (its own
  client chrome replaces them); `TelegramGate` swaps the marketing landing
  page for `TelegramHome`, a compact module picker; `TelegramBackButton`
  syncs Telegram's native back button to the Next.js router, hidden on the
  home screen and wired to `router.back()` everywhere else.
- **Primary actions:** `useTelegramMainButton({ text, onClick, visible, disabled })`
  drives Telegram's native bottom bar and returns `isTelegram`, so a step's
  regular in-page button can hide itself (`{!isTelegram && <Button .../>}`)
  without duplicating the control. Telegram exposes exactly **one** MainButton
  — a screen with more than one candidate primary action (e.g. Tarot's reveal
  step: "Reveal all" *or* "Continue") passes whichever is currently salient,
  switching dynamically as state changes, rather than trying to represent two.
  **Load-bearing constraint this implies:** a screen must never have two
  `useTelegramMainButton()` calls mounted at once, even if one is `visible:
  false` — both still run their effects on every commit, and effect order is
  child-before-parent, so an outer "hidden" hook's `hide()` reliably clobbers
  an inner "visible" one's `show()`. This broke numerology/astrology once
  (form + result lived in one component with a conditional return, so the
  result's hook was always mounted alongside the form's); the fix was
  splitting them into mutually-exclusive components, the same shape the
  Tarot flow's separate step components already had. Keep that shape for any
  new flow with more than one MainButton-driven screen.
- **Unchanged:** every API route, the domain/service layers, and the DB
  schema — a Telegram user is just a `User` row like any other, so
  `/api/readings`, `/api/ai/interpret`, favorites, etc. all work identically
  regardless of which shell the request came from.
- **Not testable in this environment:** anything requiring a real Telegram
  client and bot (no public HTTPS URL or bot token exists here). Verified
  instead by mocking `window.Telegram.WebApp` in-browser — see TODO.md.

## 17. Numerology & Astrology

Both follow the exact shape Tarot established: static domain data +
a pure calculation function + a guest-friendly flow, no AI call needed
(these are deterministic, unlike a tarot interpretation).

- **Numerology** (`src/modules/numerology/`): birth-date-only numbers work
  for any guest (no name required); a fuller profile unlocks once a name is
  given.
  - `calculateLifePathNumber()` sums every digit of the birth date;
    `calculateBirthdayNumber()` reduces the day-of-month alone. Both preserve
    master numbers (11/22/33) rather than reducing them further — the
    standard numerology convention, centralized in
    `services/numerology-math.ts` (`reduceToNumerologyDigit`) so every number
    type applies the same rule.
  - **Two letter-value systems**, selectable once a name is entered:
    **Pythagorean** (modern; the familiar A–Z cycling 1–9) and **Chaldean**
    (older, Babylonian-derived; letters map 1–8, no letter maps to 9 — 9 is
    reserved as sacred/complete). Tables live in
    `domain/letter-values.data.ts`. This is the "old vs. new numerology" the
    product asked for — see Decision Log §8.
  - From a full name, `services/calculate-name-numbers.ts` derives
    **Expression** (all letters), **Soul Urge** (vowels only), **Personality**
    (consonants only), and **Maturity** (Life Path + Expression, reduced
    again) — computed once per system, so a name genuinely produces two
    different readings, not just relabeled numbers.
  - Meanings for all number types reuse the existing 12 Life-Path-meaning
    entries rather than duplicating long-form content
    (`domain/number-type-framing.ts`), framed per number type (e.g. "Your
    Expression Number describes...").
  - UI (`components/numerology/`): `NumerologyInputForm` (name optional,
    birth date required) → `NumerologyResult`, which always shows Life Path +
    Birthday, and — only if a name was given — a Pythagorean/Chaldean tab
    switcher over the four name-derived numbers.
- **Astrology** (`src/modules/astrology/`): **sun sign, plus sect — still no
  full natal chart.** A full chart needs an exact birth time *and place* plus
  planetary ephemeris data — a real sub-project (see TODO.md Phase 8), not
  something to fake with a birthdate alone. `calculateSunSign()` handles the
  12 tropical zodiac date ranges, including Capricorn's year-boundary
  wraparound.
  - **Sect** (`domain/sect.data.ts`) is a real Hellenistic-astrology concept:
    a chart is diurnal ("day") if the Sun was above the horizon at birth,
    nocturnal ("night") if below — traditionally read as favoring a
    different triad of planets and a different temperament (see Decision Log
    §8 for why this — not a fabricated sunrise/sunset calculation — is the
    "day or night at birth" mechanic). `AstrologyInputForm` asks directly
    ("Day" / "Night" / "Not sure"), since the honest data source is the
    person's own knowledge, not a computed guess; "Not sure" (or no
    selection) simply omits the sect section from the result rather than
    guessing.
- Both are reachable standalone (`/numerology`, `/astrology`) and don't yet
  persist the richer per-system/per-number/sect data —
  `NumerologyReading`/`AstrologyReading` still only store birth date +
  Life Path / sun sign (see TODO.md).

## 18. Cross-Module Actor "Fun Fact"

A lightweight, clearly-entertainment feature layered across all three
modules: after a Tarot reading, a numerology result, or an astrology result,
an optional card names a real actor who shares something with it.

- **Matching is data-based, not photo/facial-recognition** (`src/modules/fun-facts/`):
  a small curated list of actors (`ACTORS`) stores each one's real, publicly
  documented birthdate — their zodiac sign and Life Path Number are *computed*
  from it at runtime via the same functions the user's own result uses, never
  hand-entered, so they can't drift out of sync with the calculation logic.
  - Astrology → an actor sharing the same sun sign.
  - Numerology → an actor sharing the same Life Path Number.
  - Tarot → an actor sharing an archetype tag with a drawn Major Arcana card
    (`MAJOR_ARCANA_ARCHETYPES`, a small hand-curated tag vocabulary used on
    both sides of the match). Minor Arcana cards have no archetype tag, so a
    reading with none returns no fun fact rather than forcing a weak match.
  - Selection among multiple matches is deterministic (seeded by the
    reading/birthdate), not `Math.random()` — same principle as the draw engine.
- **Framing, everywhere it's shown:** "a playful coincidence, not a real
  connection" — this is content about real, named people, so it stays
  factual (real birthdates, no fabricated claims) and is never presented as
  insight or a genuine likeness (see §8/§35's "reflection, not prophecy"
  principle, applied here too).
- This was a deliberate scope choice over a photo/facial-similarity feature
  (upload a selfie, compare against actor photos) — the latter needs a face-
  comparison API, an actor photo dataset with usage-rights considerations,
  and real biometric-data handling, a materially different (and more
  privacy-sensitive) feature. Flagged explicitly to confirm before investing
  further, rather than assumed silently.

## 19. Deployment Strategy

- **App:** Vercel (native Next.js support, image optimization, edge-friendly).
- **Database:** managed Postgres (Neon/Supabase/Vercel Postgres — anything
  Prisma can reach via `DATABASE_URL`).
- **Env vars required in production:** `DATABASE_URL`, `AUTH_SECRET`,
  `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` (optional), `ANTHROPIC_API_KEY`
  (optional — falls back to Mock provider without it), `TELEGRAM_BOT_TOKEN`
  (optional — Telegram sign-in only; the site works without it),
  `NEXT_PUBLIC_SITE_URL`, and `NEXT_PUBLIC_OPERATOR_NAME/REGISTRATION/ADDRESS/
  EMAIL` (shown in the privacy policy and consent form). See `.env.example`.
- **Currently live:** https://taroproject.vercel.app (Vercel project
  `taro_project`, team `qcom666`, production-only env vars `AUTH_SECRET`,
  `TELEGRAM_BOT_TOKEN`, `NEXT_PUBLIC_SITE_URL`; no `DATABASE_URL` yet, so
  accounts/history are off in production). Deployed with `npx vercel --prod`
  from the working tree — the repo has no git remote, so no auto-deploys.
  Note: on a machine behind a fake-IP proxy, `curl` to `*.vercel.app` can fail
  the TLS handshake even though the site is fine; check in a browser.
- **Telegram-specific:** the Mini App URL registered with @BotFather must be
  this app's real, public HTTPS deployment — Telegram will not load a
  `localhost` URL, so the Mini App shell can only be exercised against a real
  Telegram client once deployed.
- **Migrations:** `prisma migrate deploy` in the deploy pipeline.
- CI (future work, not wired yet): typecheck → lint → `vitest run` → `next build`.

## Decision Log (unspecified in the brief → resolved here)

1. **Tarot cards & spreads are static TypeScript data, not Postgres rows** —
   they're versioned content shipped with app code (interpretation logic
   references card IDs directly), rarely change, and require zero DB seeding
   for the MVP to run. `Reading`/`ReadingCard` store plain string IDs, so
   migrating this content into a DB-backed CMS later doesn't touch the
   transactional schema.
2. **No `shadcn` CLI** — hand-authored a small Radix + CVA + Tailwind kit in
   `components/ui` instead of running the interactive `shadcn init`. Same
   conventions/quality bar, zero risk of an interactive prompt stalling
   automated setup, and the components are mystical-theme-first rather than
   default-theme-then-reskin.
3. **Card artwork is procedurally rendered (SVG/CSS), not raster images** —
   there is no licensed Rider-Waite-style artwork available to ship, and
   fetching card images from the internet isn't appropriate here. Each
   `TarotCard.image` field is reserved for real artwork later; today the UI
   renders a generative, symbolic card face (suit glyph, Roman/Arabic numeral,
   gradient keyed to arcana/suit). This also keeps initial load fast (no image
   weight) and sidesteps a licensing question entirely.
4. **Guests can complete a full reading**, but saving requires an account.
   Maximizes the try-before-signup acquisition loop the landing page promises
   ("Interactive Tarot preview") while keeping `Reading` rows meaningfully
   attached to a `User`.
5. **Reversed-card probability fixed at 30%**, a common traditional
   convention, exposed as a named constant (`REVERSED_PROBABILITY`) rather than
   a magic number, easy to make configurable per-spread later if needed.
6. **JWT session strategy**, not database sessions — required by Auth.js for
   the Credentials provider to work at all.
7. **Prisma pinned to `7.10.0`, not the `latest` npm tag** — `latest` currently
   resolves to `8.0.0-rc.13`, a release candidate that replaces the familiar
   local ORM CLI with a cloud-platform CLI (`prisma auth login`, hosted
   projects, "data contracts"). That's the wrong tool for a self-hosted app
   and not something to opt into without asking. `7.10.0` is the last stable
   release with the standard `prisma generate` / `prisma migrate` workflow.
   One consequence ships with it: Prisma 7 removed `datasource { url = ... }`
   from `schema.prisma` entirely. The connection string now lives in two
   places — `prisma.config.ts` (read by the CLI for `migrate`/introspect) and
   a driver adapter passed explicitly to `new PrismaClient({ adapter })` in
   `src/lib/db.ts` (there is no zero-argument `PrismaClient` anymore). The
   adapter (`@prisma/adapter-pg`) is constructed unconditionally with either
   the real `DATABASE_URL` or a placeholder — safe because the underlying
   `pg.Pool` connects lazily, and `isDatabaseConfigured()` guarantees no query
   ever runs against that placeholder.
8. **"Old and new numerology" → Chaldean vs. Pythagorean; "day or night at
   birth" → astrological sect, not a numerology field.** The product ask was
   in general terms ("add old and new numerology... down to the time a person
   was born, day or night"), aimed at real-world authenticity rather than a
   specific named mechanic. Chaldean (older, Babylonian-derived) vs.
   Pythagorean (modern, the system almost all consumer numerology already
   uses) is the actual old/new split practitioners mean, so name-derived
   numbers are now computed both ways instead of picking one arbitrarily.
   "Day or night at birth" is not a numerology concept at all — it's the
   traditional astrological notion of *sect* (Hellenistic astrology), so it
   was implemented in the astrology module against a real birth-time
   distinction (Sun above vs. below the horizon) rather than invented as a
   numerology input. Both additions deliberately stayed inside "compute from
   data the person actually knows" (name, birth date, day/night) — no
   fabricated precision (e.g. no fake sunrise/sunset-from-date-alone
   calculation), in keeping with the product's explicit request for the
   mechanics to feel real rather than gimmicky.
9. **Russian localization covers chrome, marketing copy, and — as of the
   follow-up pass — Tarot card/spread names and descriptions; not the deeper
   meaning datasets or AI output.** (Amended: the first pass excluded card and
   spread names too, but the product owner flagged English spread names
   sitting inside an otherwise-Russian landing page, so name/description/
   position-label were brought in; the long-form `meanings` are the remaining
   gap.) The original line drawn: anything that's the same
   fixed set of UI words regardless of which card/spread/number/sign a user
   gets (nav, buttons, form labels, section headings, error/empty states, the
   entire landing page's own copy) is in `lib/i18n/{en,ru}.ts` and fully
   translated. **(Amended by #11 — the content below was later translated too.)**
   Anything that's part of the actual esoteric content — the 78
   card names/meanings, spread descriptions, the 12 Life Path meaning essays,
   12 zodiac descriptions, sect descriptions, and every AI-generated
   interpretation — stays English-only for now. That content is hundreds of
   hand-written (or AI-generated-at-request-time) fields; translating it
   properly is a real content project of its own (and, for the AI provider,
   a prompt-localization change, not a dictionary one), not something to
   fold into a chrome/engineering pass. `PROJECT_ARCHITECTURE.md` §14 has
   the full list of what's excluded and why.
10. **Card faces were redesigned around an arched "window" layout** (Decision
    Log #3 still holds — no licensed art, everything procedural SVG). The
    brief was "modern, but keep the spirit of original tarot cards": the
    template stays classic (numeral across the top, one central symbol, name
    plate at the bottom, gold linework, ornamental corner marks), while the
    look moves modern (dark twilight gradient with a gold horizon glow, thin
    strokes, an Art-Deco arch around the symbol). Each Major Arcana now has
    its own glyph echoing traditional iconography (∞ Magician, scales Justice,
    inverted pentagram Devil, crescent Moon…) instead of all 22 sharing one
    sunburst. Two implementation traps worth remembering: computed SVG
    coordinates must be rounded (`n()` in `tarot-card-face.tsx`) — `Math.cos`
    differs in the last bit between Node and the browser, which is a
    hydration mismatch; and the crescent is built from the intersection of
    two circles, because two arcs whose endpoints are a full diameter apart
    collapse to a zero-area shape (the Moon rendered as nothing).
11. **Decision #9 was reversed: card meanings, keywords, Life Path / zodiac /
    sect text, fun facts and AI interpretations are now translated.** The
    first pass left them English on scope grounds; screenshots showed a
    Russian UI wrapped around English readings, which reads as broken, not as
    "scoped". The pattern is unchanged (English fields + `*Ru` siblings,
    required by the types so nothing ships half-translated, locale-aware
    accessors taking a plain `"en" | "ru"`). The AI path now takes a `locale`,
    and the interpretation panel regenerates on a language switch. Russian
    text is written to dodge grammar traps rather than fight them: subjects
    fixed to «Карта …», domain phrases pre-declined, keywords quoted in «…»,
    gender-neutral nouns for people ("звезда кино"), and "секта"/"sect"
    avoided because the Russian word means a cult.
12. **Cyrillic names are first-class in numerology**, not rejected. Pythagorean
    uses the Russian table directly, Chaldean transliterates (there is no
    traditional Chaldean table for Cyrillic — this is disclosed in the UI).
    A name with no calculable letters is treated as "no name given" instead of
    summing to 0 (which used to crash on an undefined meaning).
13. **Legal approach: real drafts with honest placeholders, not fake
    certainty.** Policy + separate consent + explicit, unticked, per-door
    consent capture with an auditable DB record and versioning. Operator
    identity is env-driven and shows `[placeholders]` until filled — a
    visible gap is safer than an invented legal identity. Everything is
    marked as a draft needing lawyer review. The biggest known gap is data
    localization (152-ФЗ art. 18 ч.5), which is an infrastructure decision,
    not a text one: today's hosting does not satisfy it for Russian citizens'
    data, and the policy must be brought in line with whatever is chosen.
14. **The "not real fortune-telling" disclaimer is fine print, not hidden.**
    The brief asked for it to be present but not conspicuous. It sits at the
    very bottom of the footer in 11px muted silver — easy to miss, but
    legible, and always in the DOM. Making it unreadable would risk it having
    no legal effect and conflicts with consumer-information rules, so
    "discreet" was interpreted as "small and quiet", never "low-contrast to
    the point of invisible". The wording lives in `footer.disclaimer`
    (en + ru) and is reused on the Telegram screens where the footer is hidden.
15. **Production deploy is manual `vercel --prod` from the working tree.**
    The repo has no commits or remote, so there is no Git integration yet;
    connecting a GitHub repo would give push-to-deploy and preview URLs.
    Production has no database, so sign-up/history are unavailable there
    until a `DATABASE_URL` is added (and, per #13, where that DB lives is a
    legal decision, not just a technical one).
16. **"AI" wording was removed from public copy until a real model is
    connected.** Production has no `ANTHROPIC_API_KEY`, so interpretations come
    from the built-in template generator (`MockProvider`); calling that "AI"
    misleads users. Marketing, pricing, FAQ, Telegram screens and SEO metadata
    now say "interpretation"/«толкование». The result heading is dynamic: it
    only reads "AI interpretation" when `aiResult.provider` is not `"mock"`
    (`result-step.tsx`); saved readings don't store the provider, so they stay
    neutral. When a real model is connected, restore "AI" wording in the
    dictionaries (see git history of `lib/i18n/{en,ru}.ts` and `layout.tsx`)
    and re-check the privacy policy's AI-provider paragraph.
17. **Fabricated testimonials were deleted** (the landing section and its
    dictionary keys). Fake reviews on a public site are a legal risk; add the
    section back only with real, attributable quotes.
18. **Share preview:** `app/opengraph-image.tsx` generates a 1200×630 card
    (Latin-only — `ImageResponse`'s built-in font has no Cyrillic; adding a
    font would spend its 500KB bundle budget).
