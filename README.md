# 🔦 Beacon

An early-career startup job hub. Upload your resume once; Beacon parses it into a
structured profile, pulls **live** entry-level openings from real startup job
boards, ranks them against your resume, and prepares each application so it's
mostly filled out for you — always with a direct link to the official posting.

Built for people with **0–2 years of experience** looking at startups and
scale-ups.

---

## What's here

**Phase 1 — the working core (this repo):**

- **Resume upload & parsing** — PDF (text-based) or `.txt`. Text is extracted
  server-side and turned into a structured JSON profile (contact, links,
  education, years of experience, top skills, and 3–5 realistic entry-level
  target roles). Uses the Claude API when a key is set, with a heuristic
  fallback so the app still runs without one.
- **Live job ingestion** — real data from day one (see [Data sources](#data-sources)).
  Every source is normalized into one job shape and filtered to entry level.
- **Matching & ranking** — cheap keyword-overlap scoring for the whole set, then
  a single Claude call generates specific fit reasons for the top shortlist
  (cost-sane by design). Falls back to templated reasons without a key.
- **The hub** — ranked job cards with title, company, salary (marked *est.* when
  inferred), work type (In-office / Hybrid / Remote), location, a 0–100 fit
  score, and a one-line fit reason. Filter by work type; sort by best match or
  salary.
- **Application kit** — per job: copy-ready profile fields, a tailored 90–130
  word cover note, answers to standard screening questions grounded in the
  resume, and the direct apply link. Works even without the extension.

**Phase 2 — autofill & persistence (scaffolded in [`/extension`](extension/)):**

- A Manifest V3 Chrome extension that autofills real application forms from your
  saved profile. See [extension/README.md](extension/README.md) for the exact
  ATS coverage.

---

## Quick start

```bash
npm install
cp .env.example .env        # fill in ANTHROPIC_API_KEY (optional but recommended)
npx prisma db push          # creates the SQLite cache (prisma/dev.db)
npm run dev                 # http://localhost:3000
```

Upload a resume, and the hub populates with live matches.

> **Running behind a corporate/egress proxy?** Node's built-in `fetch` ignores
> `HTTPS_PROXY`. Beacon detects `HTTPS_PROXY`/`HTTP_PROXY` and routes outbound
> job-source requests through it automatically. If the proxy re-terminates TLS,
> also set `NODE_EXTRA_CA_CERTS=/path/to/ca-bundle.crt` when starting the server.

### Configuration

| Env var | Required | Purpose |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Recommended | Resume parsing, fit reasons, cover notes, screening answers. Without it, Beacon uses a heuristic parser and templated text — lower quality, but fully functional. **Keep it server-side only.** |
| `ANTHROPIC_MODEL` | No | Defaults to `claude-haiku-4-5-20251001` (fast, low cost). |
| `DATABASE_URL` | Yes | SQLite for the MVP (`file:./dev.db`). Swap to Postgres for phase 2 accounts. |
| `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` | No | Optional Adzuna aggregator (salary data). **Needs a free account** at developer.adzuna.com. Not wired into ingestion yet — placeholder for phase 3 volume. |
| `ENABLE_REMOTIVE` | No | Remote-focused free source, on by default. |
| `REFRESH_SECRET` | No | If set, protects the `/api/refresh` endpoint. |

---

## Data sources

Beacon only uses sources that expose usable job data via public APIs. **None of
the phase-1 sources require an API key.**

| Source | Key needed? | Notes |
| --- | --- | --- |
| **The Muse** (`themuse`) | No | Free public API with an `Entry Level` filter. Broad first pass. No salary data → all salaries estimated. |
| **Greenhouse** (`greenhouse`) | No | `boards-api.greenhouse.io/v1/boards/{slug}/jobs`. Hit per startup slug. Reliable official apply URL per job. |
| **Lever** (`lever`) | No | `api.lever.co/v0/postings/{slug}?mode=json`. Same idea. |
| **Ashby** (`ashby`) | No | `api.ashbyhq.com/posting-api/job-board/{org}`. Same idea. |
| **Remotive** (`remotive`) | No | Free, remote-only. Supplementary. |
| Adzuna | **Yes** (create account) | Has salary data. Placeholder only — not yet wired in. |

The startup **seed list** of Greenhouse/Lever/Ashby board slugs lives in
[`src/lib/jobs/seed.ts`](src/lib/jobs/seed.ts). Slugs drift over time as
companies migrate ATS — ingestion is resilient: any board that 404s or returns
nothing is skipped and logged, so a stale entry never breaks the app, it just
contributes zero jobs. **Edit that file to tune coverage.**

### Terms & honesty

- We hit **public, documented APIs only** — no scraping of sites that forbid it.
- **Salary is never faked.** If a posting lists a range we show it as listed;
  otherwise the card shows "Salary not listed" or an inferred figure clearly
  marked `(est.)`, and the app tells you to confirm on the official posting.
- **MVP privacy:** nothing is stored beyond your browser session. Your resume is
  parsed on the server and not persisted (job *listings* are cached server-side;
  your *profile* is not).

---

## How the cache refreshes

Job listings are cached in SQLite (`CachedJob`) and considered fresh for 6 hours.
The first request after that re-ingests from all sources. To warm the cache on a
schedule instead of on a user's request:

- Hit **`GET /api/refresh`** from a cron (e.g. Vercel Cron), optionally guarded by
  `REFRESH_SECRET`, or
- Run **`npm run jobs:refresh`** from an external scheduler.

---

## Architecture

```
src/
  app/
    page.tsx                 Landing → upload → hub (client orchestrator)
    api/
      parse-resume/route.ts  PDF/txt → text → structured profile
      jobs/route.ts          profile → cached live jobs → ranked list
      application-kit/route.ts  job + profile → cover note, screening, fields
      refresh/route.ts       scheduled cache refresh
  components/                UploadDropzone, ProfileBar, JobCard, ApplicationKitPanel
  lib/
    resume-extract.ts        pdf-parse / text extraction (Node runtime)
    resume-parse.ts          Claude + heuristic profile parsing
    jobs/
      sources/               themuse, greenhouse, lever, ashby, remotive adapters
      util.ts                normalization: entry-level filter, work type, salary
      seed.ts                startup board slugs
      ingest.ts              orchestration + SQLite caching
    match.ts                 keyword scoring + LLM fit reasons
    application-kit.ts       cover note + screening answers
    anthropic.ts             Claude client + JSON extraction
    http-proxy.ts            optional HTTPS_PROXY support for fetch
extension/                   Phase 2 Manifest V3 Chrome extension (see its README)
```

**Stack:** Next.js (App Router) · TypeScript · Tailwind · Prisma + SQLite ·
Claude API.

---

## Roadmap

- **Phase 2:** user accounts (profile persistence), a saved/applied tracker, and
  the browser extension for real form autofill.
- **Phase 3:** email job alerts, more sources (wire in Adzuna/Arbeitnow), and a
  toggle to weight matches toward specific tracks (e.g. security / GRC).
