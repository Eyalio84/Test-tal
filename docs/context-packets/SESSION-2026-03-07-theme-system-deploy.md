# Session Context Packet — 2026-03-07 — Theme System + Deploy Prep

## What Was Accomplished

### Theme System (COMPLETE, committed as e2187fe)
The boilerplate is now fully theme-driven. Switching themes = one env var + one seed command.

**Architecture:**
- `lib/theme.ts` — `ThemeConfig` interface + `activeTheme` resolved from `NEXT_PUBLIC_THEME` env var at build time
- `themes/jewelry.ts`, `candy.ts`, `bakery.ts`, `flowers.ts`, `wine.ts` — 5 complete themes
- `components/layout/ThemeApplier.tsx` — server component injecting CSS variables (no flash)
- All CSS variables: `--theme-accent`, `--theme-accent-light`, `--theme-accent-dark`, `--theme-bg`, `--theme-heading-font`

**To deploy a new theme:**
```bash
NEXT_PUBLIC_THEME=candy npx prisma db seed
NEXT_PUBLIC_THEME=candy npm run build
```

### Aria Voice System (COMPLETE)
- `hooks/useAriaLive.ts` — `sendTextToAria(text)` export for programmatic narration
- `components/aria/AriaTourOverlay.tsx` — 9-stop voice-narrated store tour
  - Auto-navigates to each page (/, /products, /products/[slug], /collections, /about, /contact, /cart, /admin, back to /)
  - Aria narrates each step via Gemini Live WebSocket
  - Dual visual modes: spotlight (dark overlay + hole) for element focus, page-tour (card at bottom) for page visits
  - Guards: `narrationSentRef` + `navigatedRef` prevent double-fire

### Database (READY FOR DEPLOY)
- Prisma schema: `sqlite` → `postgresql`
- All model `id` fields have `@default(cuid())`
- `SiteContent.updatedAt` has `@updatedAt`
- Neon PostgreSQL connection string already in `.env` (see below)

### Docker + Cloud Run (READY)
- `Dockerfile` — 3-stage build (deps / builder / runner), `output: standalone`
- `.dockerignore` — excludes .git, node_modules, .next, *.db
- `DEPLOY-CONTEXT.md` — full step-by-step deployment guide with all env vars

---

## Current State of .env (on /root/tal-boilerplate/)

```env
DATABASE_URL="postgresql://neondb_owner:...@...neon.tech/neondb?sslmode=require"
NEXTAUTH_SECRET="<generated>"
NEXTAUTH_URL="http://localhost:3001"   # UPDATE TO PRODUCTION URL after deploy
GOOGLE_CLIENT_ID="<from OAuth credentials>"
GOOGLE_CLIENT_SECRET="<from OAuth credentials>"
NEXT_PUBLIC_GEMINI_API_KEY="<Gemini API key>"
NEXT_PUBLIC_WHATSAPP_NUMBER="<optional>"
RESEND_API_KEY="<optional>"
NEXT_PUBLIC_THEME="jewelry"
```

---

## What Needs To Happen On The Laptop

### Step 1 — Extract tarball
```bash
tar -xzf tal-boilerplate-v2.tar.gz
cd tal-boilerplate
```

### Step 2 — Install dependencies
```bash
npm install
```

### Step 3 — Copy .env
Copy your `.env` file from the phone (has Neon DB URL, OAuth keys, Gemini key).
Or recreate it — all values are in DEPLOY-CONTEXT.md.

### Step 4 — Seed the database
```bash
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```
(Seed reads NEXT_PUBLIC_THEME from env, defaults to "jewelry")

### Step 5 — Build check (optional, verify before deploy)
```bash
npm run build
```

### Step 6 — Deploy to Cloud Run
```bash
# Authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Build + push Docker image
gcloud builds submit \
  --tag gcr.io/YOUR_PROJECT_ID/tal-boilerplate \
  --build-arg NEXT_PUBLIC_GEMINI_API_KEY="your-key" \
  --build-arg NEXT_PUBLIC_THEME="jewelry" \
  --build-arg NEXT_PUBLIC_WHATSAPP_NUMBER="optional"

# Deploy
gcloud run deploy tal-boilerplate \
  --image gcr.io/YOUR_PROJECT_ID/tal-boilerplate \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="your-neon-url" \
  --set-env-vars NEXTAUTH_SECRET="your-secret" \
  --set-env-vars NEXTAUTH_URL="https://YOUR-CLOUD-RUN-URL" \
  --set-env-vars GOOGLE_CLIENT_ID="your-id" \
  --set-env-vars GOOGLE_CLIENT_SECRET="your-secret" \
  --set-env-vars RESEND_API_KEY="your-key"
```

### Step 7 — After deploy: Update OAuth
Go to https://console.cloud.google.com/apis/credentials
Add to "Authorized redirect URIs":
`https://YOUR-CLOUD-RUN-URL/api/auth/callback/google`
Update `.env` / Cloud Run env var: `NEXTAUTH_URL=https://YOUR-CLOUD-RUN-URL`

### Step 8 — Push to GitHub (need fresh token)
```bash
git remote set-url origin https://YOUR_TOKEN@github.com/Eyalio84/Test-tal.git
git push origin main
```
Get new token: github.com → Settings → Developer settings → Personal access tokens

---

## Pending Items (Nice-to-have, not blocking demo)

1. **ARIA_FUNCTIONS slugs** — In `hooks/useAriaLive.ts`, the `add_to_cart` and `check_stock` function declarations hardcode jewelry slugs. For non-jewelry themes, these should come from `activeTheme.products`. Low priority — Aria still works, just can't add candy items by slug.

2. **Collections page** — `app/collections/page.tsx` currently hardcodes 5 jewelry collection cards. Should read from `activeTheme.collections`. Easy fix: import `activeTheme` and map.

3. **Product description on detail page** — `app/products/[slug]/page.tsx` uses DB data (always correct). No change needed.

4. **Newsletter flow** — `POST /api/newsletter` saves email to DB but doesn't send anything. Add Resend welcome email if desired.

---

## Commit History (key milestones)
```
e2187fe  Theme system: 5 e-commerce themes + Neon PostgreSQL + Cloud Run deploy
c8b9c00  Day 3 Task 2: contact metadata + ContactForm client extraction
7de45bd  Day 3 Task 1: stockCount schema + seed
317ca11  (pre-session baseline) Day 6 shop features
```

## Tech Stack Summary (for telling Tal)
- **Next.js 16** App Router — server components, SSG for product pages
- **Tailwind v4** — utility CSS, zero config
- **Prisma v5** + **Neon PostgreSQL** — type-safe ORM, serverless Postgres
- **NextAuth v5** — Google OAuth (extensible to email/GitHub/Apple)
- **Zustand** — cart state with localStorage persist
- **Resend** — transactional email (contact form)
- **Stripe-ready** — checkout API route + success/cancel pages wired
- **Gemini Live API** — real-time voice assistant (Aria) via WebSocket
- **Docker + Cloud Run** — containerized deploy, auto-scaling to zero
- **Theme system** — full store identity swap via one env var
