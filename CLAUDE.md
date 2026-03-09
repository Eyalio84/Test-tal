# StoreKit — Claude Code Instructions

## Project Identity
- **Product:** StoreKit — Voice-AI website builder platform
- **Stack:** Next.js 16 App Router · Prisma v5 · Neon PostgreSQL · NextAuth v5 · Zustand · Stripe · Gemini Live API · Cloudflare R2
- **Dev server:** `npm run dev` → port 3000 (locked in package.json + .env.local)
- **Working dir:** `/root/tal-boilerplate`
- **Cloud Run:** https://tal-store-233162846070.europe-west1.run.app (port 3000)

## Before every commit
```bash
npx tsc --noEmit   # must pass — no TypeScript errors
npm test           # must pass — no test failures
npm run lint       # review warnings — fix errors
```

## Key conventions
- All API route inputs validated with Zod schemas in `lib/validations.ts`
- Environment variables accessed via `env.ts` (never raw `process.env` in app code)
- Images compressed to WebP before R2 upload via `lib/compress.ts`
- Errors in production captured automatically by Sentry (disabled in dev)
- Server state (DB-fetched data) managed with TanStack Query — never `useState + useEffect + fetch`

## Architecture notes
- **Auth:** NextAuth v5 + PrismaAdapter + Google OAuth only. No `pages` override. Admin protected server-side in `app/admin/layout.tsx`.
- **Themes:** 8 themes. Runtime switching via `SiteContent` key `active_theme`. `resolveTheme()` merges static fallbacks + DB `ThemeImage` overrides.
- **Aria contexts:** `"platform"` (homepage) · `"demo"` (demo pages) · `"member"` (dashboard)
- **Images:** Static theme TS files are fallbacks. DB `ThemeImage` records override. All R2 URLs via `r2Key()` / `r2Url()` in `lib/r2.ts`.
- **No middleware.ts** — admin protection at layout level only.

## Developer tools reference
See `docs/tools/` for reference documentation on every tool:
- `env.md` — @t3-oss/env-nextjs
- `zod.md` — input validation
- `biome.md` — linting and formatting
- `sharp.md` — image compression
- `sentry.md` — error monitoring
- `vitest.md` — unit tests
- `tanstack-query.md` — server state
- `image-scout.md` — AI image sourcing agent

## Known gotchas
- OAuth redirect loop: caused by `pages: { signIn: "/api/auth/signin" }` — do NOT add this
- `siteId` is nullable — FK constraint prevents default string ID
- Scripts must have `import "dotenv/config"` as FIRST import (loads .env.local before env.ts validation runs)
- Guided tour: fully removed. Do not reference `TourStep`, `startTour`, `AriaTourOverlay`
- Biome v2 is installed — schema URL must be `2.x.x`, `organizeImports` key does not exist in v2

---

## Pre-Launch Checklist

> Add these tools WHEN YOU HAVE REAL USERS generating traffic. Not before.

### Upstash Redis + rate limiting
- **Why:** Without rate limiting, any user can spam `/api/media/upload` and rack up R2 costs. Also needed to protect Gemini API calls from abuse.
- **Install:** `npm install @upstash/redis @upstash/ratelimit`
- **What to rate limit:** `/api/media/upload` (10 req/min per user), Gemini WebSocket connections
- **Docs:** https://upstash.com/docs/redis/sdks/ratelimit/overview

### PostHog
- **Why:** You need to know which themes get demoed most, which Aria commands are used, where users drop off in onboarding. Product decisions should be based on data.
- **Install:** `npm install posthog-js posthog-node`
- **What to track:** Theme demo views, Aria voice sessions started, checkout initiated, sign-ups
- **Docs:** https://posthog.com/docs/libraries/next-js

### Trigger.dev (background jobs)
- **Why:** Long-running tasks shouldn't block API responses. Image migration, email sequences, and nightly health checks need to run in the background with retry logic.
- **Install:** `npm install @trigger.dev/sdk`
- **Jobs to create:** New site provisioning, theme image migration on site creation, onboarding email sequence
- **Docs:** https://trigger.dev/docs

---

## Post-Launch Checklist

> Add these tools once you have consistent traffic and need to optimise.

### Prisma Accelerate
- **Why:** Neon serverless opens a new DB connection on every cold start. Accelerate pools connections and caches frequent queries (like `resolveTheme()`).
- **How:** Replace `DATABASE_URL` with Accelerate's URL. Add `{ cacheStrategy: { ttl: 60 } }` to hot queries.
- **Docs:** https://www.prisma.io/docs/accelerate

### Axiom (structured logging)
- **Why:** `console.log` doesn't scale. Axiom lets you search logs by `userId`, `themeId`, `requestId` across all server instances.
- **Install:** `npm install next-axiom`
- **Docs:** https://axiom.co/docs/send-data/nextjs

### shadcn/ui (component library migration)
- **Why:** The admin UI is built with hand-rolled Tailwind components. shadcn/ui provides accessible, production-tested equivalents (data tables, dialogs, tabs, command palettes).
- **Install:** `npx shadcn@latest init`
- **What to migrate:** Admin nav, media grid, image upload dialog, theme selector tabs
- **Docs:** https://ui.shadcn.com
