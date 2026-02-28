# Internship Application Tracker & Job Discovery

Full-stack internship tracker and intelligent job discovery platform tailored to a single profile (Hari). Built with Next.js 14 (App Router), TypeScript, Tailwind, shadcn-style UI, **Firebase (Firestore)**, and OpenAI.

## Tech stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn-style components
- **Backend:** Next.js API routes
- **Database:** Firebase Firestore (replaces PostgreSQL/Prisma)
- **Scraping:** Cheerio, Puppeteer/Playwright (modular scrapers with rate limiting)
- **Scheduling:** node-cron (6am / 6pm daily scrapes)
- **Auth:** NextAuth.js (GitHub/Google OAuth) — scaffold only
- **AI:** OpenAI GPT-4o (relevance scoring, cover letter generation, resume suggestions)

## Setup

See **[SETUP.md](./SETUP.md)** for step-by-step instructions. Summary:

1. **Install dependencies:** `npm install`
2. **Firebase:** Create a project at [Firebase Console](https://console.firebase.google.com), enable Firestore, and create a service account key.
3. **Environment:** Copy `.env.example` to `.env` and set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, and `OPENAI_API_KEY`.
4. **Run:** `npm run dev` → open [http://localhost:3000](http://localhost:3000) and click “Open Dashboard”.

No database migrations — Firestore creates collections on first write.

## Project structure

- `app/` — Next.js App Router: landing, `(app)` group (dashboard, tracker, calendar, companies, analytics, assistant, settings), API routes
- `app/api/` — `jobs` (GET list, PATCH update), `scrape` (POST trigger), `cover-letter` (POST generate)
- `lib/config/profile.ts` — Hardcoded `USER_PROFILE` (roles, firms, keywords, blacklist, experience)
- `lib/db/` — Firebase Admin SDK and Firestore helpers (`getJobs`, `createJob`, `updateJob`, etc.)
- `lib/scrapers/` — One file per source: `github-repos`, `simplify`, `linkedin`, `handshake`, `levels-fyi`, `indeed`, `career-pages`, `google-fallback`; shared `utils` (rate limit, backoff, visa flag)
- `lib/ai/` — Relevance scoring, cover letter generation, resume diff suggestions
- `lib/cron/` — node-cron jobs for daily scrape + scoring
- `prisma/schema.prisma` — (legacy; not used) Original schema kept for reference. Data lives in Firestore collections `jobs` and `scrapeLogs`.
- `components/` — UI (button, card, badge), `AppSidebar`

## Scrapers

- **GitHub repos** — README markdown tables (e.g. pittcsc/Summer2025-Internships, SimplifyJobs/New-Grad-Positions) via GitHub API
- **Simplify Jobs** — Public job board
- **LinkedIn / Handshake** — Stubs; require session cookie (Handshake) or auth for full scrape
- **Levels.fyi, Indeed** — Cheerio-based
- **Career pages** — ATS detection (Greenhouse, Lever) and platform-specific fetch/parse
- **Google fallback** — Search for target firms

All scrapers: rate limiting (2–8s random delay), exponential backoff, dedupe by (company + title + url), visa blacklist flag, raw HTML/JSON stored. Each has `testScraper()` for development.

## AI

- **Relevance:** GPT-4o scores 0–100 (role fit, skills, visa, seniority); 2-sentence reason; sets `visaFlag` from description; EU roles not penalized.
- **Cover letter:** Picks from `USER_PROFILE.keyExperienceHighlights` by role type (quant / fusion / robotics / SWE / etc.) and generates plain-text letter.
- **Resume:** Suggests bullet reorderings/edits as diffs (no auto-edit).

## Dashboard (dark-mode-first)

1. **Discovery** — Card grid by relevance; filters (role, company, source, visa, score threshold); Save / Quick Apply / Dismiss
2. **Tracker** — Kanban (Discovered → Saved → Applied → OA → Interview → Offer / Rejected); expandable cards
3. **Calendar** — Deadlines, follow-ups, interviews (color by role category)
4. **Companies** — Target firms, open roles, contacts, notes
5. **Analytics** — Applied count, response rate, conversion; pie (by role), line (over time)
6. **Assistant** — Chat; intended to use DB + GPT for “draft cover letter”, “deadlines this week”, “best plasma physics matches”, “what to do today”
7. **Settings** — Resumes (PDF), Handshake cookie, score threshold, notifications, per-source scrape toggles, OpenAI key

## Cron

- `npm run cron` — Runs scheduler (6am and 6pm scrape + score new jobs, log to ScrapeLog).
- In production, run cron in a separate process or use a hosted scheduler (e.g. Vercel cron or external cron) that calls `POST /api/scrape` instead.

## Notes

- **Visa:** Jobs with “US citizen”, “security clearance”, “TS/SCI”, “authorized to work without sponsorship” get `visaFlag: true` and a warning badge; they are not auto-hidden.
- **EU roles:** Shown normally; no penalty in relevance.
- **Assisted auto-apply:** Not implemented; design is “pre-fill from profile and pause for user review” for Lever/Greenhouse forms.
