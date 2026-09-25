# Flat Match

A group of friends flat-hunting together fills in their constraints
separately, then gets 2–3 real shared-flat options with an honest,
per-person breakdown of what each of them gets and what they're
compromising on. The app never picks a "winner" — the goal is to make the
tradeoff conversation possible, not to skip it.

## Stack

Next.js (App Router) + TypeScript + Tailwind, Supabase (Postgres), Vitest.
No login — access is by group code + member name.

## How it works

1. Someone creates a group and gets a shareable join link.
2. Each member opens the link, enters her name, and fills in her
   constraints **separately** — nobody can see anyone else's answers until
   everyone has submitted.
3. Once everyone has submitted, [`lib/matching.ts`](lib/matching.ts) runs
   every listing against every member's hard constraints (dealbreakers) and
   soft preferences (nice-to-haves), and surfaces the top 2–3 survivors,
   ranked by weighted preference satisfaction with a balance tiebreaker so
   one person doesn't absorb all the compromise. If fewer than 2 listings
   survive, it shows "near misses" — listings that break exactly one
   person's one dealbreaker — labelled with who and what.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

Create a project at [supabase.com](https://supabase.com), then copy
`.env.example` to `.env.local` and fill in your project URL and **service
role** key (Project Settings → API):

```bash
cp .env.example .env.local
```

`SUPABASE_SERVICE_ROLE_KEY` is used server-side only (route handlers /
server actions) and is never sent to the browser. Do not prefix it with
`NEXT_PUBLIC_`.

### 3. Run the migration and seed data

In the Supabase SQL editor (or via the Supabase CLI), run, in order:

1. [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) — creates the `groups`, `members`, `responses`, and `listings` tables with RLS enabled.
2. [`supabase/seed.sql`](supabase/seed.sql) — seeds ~30 fictional Pune 3BHK listings, including ones that recreate the scenario conflicts (a Baner flat far from Hinjewadi by commute, a Kothrud flat far from Viman Nagar, a 5th-floor flat with no lift).

With the Supabase CLI installed and linked to your project:

```bash
supabase db push          # applies migrations
psql "$SUPABASE_DB_URL" -f supabase/seed.sql   # or paste seed.sql into the SQL editor
```

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create a group, and
share the join link with the other members.

### 5. Run the tests

```bash
npm test
```

[`lib/matching.test.ts`](lib/matching.test.ts) reproduces the three scenario
conflicts from the brief (commute-based exclusion, gym/family distance
exclusion, no-lift exclusion) plus rent-split and ranking-balance cases, all
against the pure `matchListings` function.

### 6. Run the scraper (optional)

```bash
npm run scrape
```

Runs [`scripts/scrape-magicbricks.ts`](scripts/scrape-magicbricks.ts)
locally (never inside a Vercel function). It fetches Pune 3BHK rental
listings from MagicBricks and upserts them into Supabase by `source_url`.
See **Limitations** below — treat this as a best-effort starting point, not
a guaranteed-working scraper.

If it can't parse a page or gets blocked, it logs a warning and exits
without touching existing data. The parsing logic is isolated behind a
[`ListingSource`](lib/listing-sources/types.ts) interface so another source
(manual CSV import, pasted listing URLs) can be swapped in later without
touching the rest of the app.

There's also an admin fallback at `/admin/listings/new` to paste in a
listing by hand.

## Limitations (honest ones)

- **Commute times are approximate, not live traffic data.** There's no maps
  API call by design (see the brief). [`lib/commute.ts`](lib/commute.ts)
  derives a drive-time matrix between ~20 Pune localities from a fixed
  straight-line-distance model, not real routing — it's internally
  consistent (symmetric, respects the triangle inequality) but will disagree
  with Google Maps on specific pairs. The UI labels these as approximate.
- **The scraper is fragile by nature.** MagicBricks (like most listing
  sites) renders search results client-side in practice, so a plain
  server-side fetch will often return an empty shell with no listing data —
  the scraper detects this (zero parsed cards) and exits without touching
  the database rather than guessing. Its CSS selectors are best-effort
  guesses at the real markup and will need updating against a live page.
  Its robots.txt compliance list (checked 2026-09-25) is hardcoded and
  should be re-verified periodically, since it can change independently of
  this scraper.
- **Bathroom/floor/amenity data scraped from search cards is unreliable.**
  MagicBricks search cards rarely expose that level of detail; the scraper
  defaults those fields conservatively rather than inventing values, and
  expects them to be corrected via the admin page or a follow-up detail-page
  fetch (not implemented).
- **No realtime status updates.** The group status page is a plain server
  render — refresh it to see who else has submitted, there's no
  websocket/polling.
- **Rent-split compromise is a simple proportional model**, not a
  negotiation tool: if an equal split breaks someone's budget, the app
  proposes a split proportional to each person's stated max (nobody pays
  over her own max), not an optimized or negotiated allocation.
