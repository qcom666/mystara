# Mystara

A premium, mobile-first Tarot reading platform — built as the first module of a
broader digital esotericism product (numerology and astrology are planned
next; see [PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md)).

Full 78-card deck, a data-driven spread engine (One Card through the ten-card
Celtic Cross), a seeded/reproducible draw engine, and AI-generated
interpretations that fall back to a deterministic offline provider when no
API key is configured — so the whole reading flow works with zero setup.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The full reading flow
(spread → question → shuffle → draw → reveal → AI interpretation) works
immediately, as a guest, with no environment variables set.

Copy `.env.example` to `.env` to configure the optional pieces:

- `AUTH_SECRET` — required for sign-in to work at all (generate with `npx auth secret`).
- `DATABASE_URL` — a Postgres connection string. Without it, sign-in/save/history
  routes return a clear "not configured" error instead of crashing; guest
  reading still works fully. Once set, run `npx prisma migrate dev --name init`.
- `ANTHROPIC_API_KEY` — optional. Without it, AI interpretation uses a
  deterministic offline provider built from the cards' real traditional
  meanings.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest — domain logic (deck, spreads, draw engine, usage limits) |

## Project docs

- [PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md) — architecture, domain
  model, API design, and the reasoning behind every non-obvious decision.
- [TODO.md](./TODO.md) — phase-by-phase implementation status.

## Note on this environment

This project directory is inside OneDrive sync. OneDrive touching files in
the background can trigger spurious Next.js Fast Refresh cycles during dev —
if HMR seems to fire on its own or `next dev` feels sluggish, exclude this
folder from OneDrive sync (or move the project outside OneDrive) before
assuming it's a code issue.
