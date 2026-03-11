# StoreKit

> A voice-AI website builder platform where merchants describe what they want and Aria, a Gemini-powered voice assistant, edits their store in real time.

StoreKit lets users launch a beautiful themed e-commerce store and edit every piece of content — hero text, product descriptions, colors, and images — entirely by voice or mouse. The platform ships 8 production-ready store themes, a Stripe-powered checkout, and a full admin suite with an AI image curation tool. It is deployed on Google Cloud Run and actively in development toward a full SaaS launch.

## ✨ Features

- **8 production-ready store themes** — jewelry, candy, bakery, flowers, wine, restaurant, portfolio, saas — each with its own brand, fonts, color palette, and product catalog
- **Aria voice AI** — live Gemini WebSocket assistant with 3 contexts (platform, template, member); edits content by voice, navigates products, answers questions, writes session test reports
- **Session Report Pad** — floating pad where Aria writes color-coded test notes (observations, bugs, navigation, summaries); exportable as `.md`
- **Aria changelog** — Aria knows her own upgrade history and can narrate recent capabilities on request
- **Image Scout** — admin tool to curate CDN images: search Pexels or Gemini, compress to WebP, upload to Cloudflare R2, generate semantic embeddings for deduplication
- **Site editor** — draft/publish content workflow; edit hero, products, navigation, and SEO by voice or direct input
- **Stripe checkout** — full cart → checkout → order flow with Stripe Checkout Sessions and webhook confirmation
- **Multi-tenant sites** — each user gets an isolated `Site` record auto-provisioned on first login
- **Aria memory** — paid tiers persist user preferences across sessions (via `AriaMemory` table)
- **Component registry** — admin palette of UI components (buttons, cards, sections) with Aria-assignable `ariaName` handles
- **Accessibility panel** — runtime font size, contrast, and motion controls accessible by voice

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router (React 19) |
| Database | Neon PostgreSQL + Prisma v5 |
| Auth | NextAuth v5 + Google OAuth + PrismaAdapter |
| Voice AI | Gemini Live API (WebSocket, `gemini-2.5-flash`) |
| Embeddings | Gemini `gemini-embedding-001` (768-dim, pgvector) |
| Image CDN | Cloudflare R2 (S3-compatible) |
| Image Compression | Sharp → WebP |
| Payments | Stripe Checkout + webhooks |
| State | Zustand v5 (Aria, cart, canvas, wishlist) |
| Server State | TanStack Query v5 |
| Styling | Tailwind CSS v4 |
| Email | Resend |
| Monitoring | Sentry |
| Linting | Biome v2 |
| Tests | Vitest + Testing Library |
| Deployment | Google Cloud Run (Docker) |

## Quick Start

### Prerequisites

- Node.js 20+
- A Neon (or any PostgreSQL) database with `pgvector` extension enabled
- Google OAuth credentials (for auth)
- Stripe account (for payments)
- Cloudflare R2 bucket (for images)
- Gemini API key (for Aria + Image Scout)
- Pexels API key (for Image Scout)

### Installation

```bash
git clone <repo-url>
cd tal-boilerplate
npm install

# Copy env template and fill in values
cp .env.example .env.local

# Run DB migrations and generate Prisma client
npx prisma db push

# Enable pgvector (required for Image Scout embeddings)
psql $DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS vector;"
psql $DATABASE_URL -c "ALTER TABLE \"CdnImage\" ADD COLUMN IF NOT EXISTS embedding vector(768);"

# Seed database with sample products and components
npx prisma db seed

# Start dev server (port 3000)
npm run dev
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon/PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✅ | Random string for JWT signing |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth app client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth app client secret |
| `ADMIN_EMAIL` | ✅ | Email address that gets admin access |
| `STRIPE_SECRET_KEY` | ✅ | Stripe secret key (`sk_...`) |
| `STRIPE_WEBHOOK_SECRET` | ✅ | Stripe webhook signing secret |
| `STRIPE_PRICE_BASIC` | ✅ | Stripe price ID for Basic plan |
| `STRIPE_PRICE_BUILDER` | ✅ | Stripe price ID for Builder plan |
| `STRIPE_PRICE_PRO` | ✅ | Stripe price ID for Pro plan |
| `GEMINI_API_KEY` | ✅ | Gemini API key (server-side) |
| `CLOUDFLARE_ACCOUNT_ID` | ✅ | Cloudflare account ID |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | ✅ | R2 S3-compatible access key |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | ✅ | R2 S3-compatible secret key |
| `CLOUDFLARE_R2_BUCKET_NAME` | ✅ | R2 bucket name |
| `CLOUDFLARE_R2_PUBLIC_URL` | ✅ | Public CDN URL for R2 (e.g. `https://pub.r2.dev`) |
| `PEXEL_API_KEY` | ✅ | Pexels API key for Image Scout |
| `SENTRY_DSN` | Optional | Sentry error tracking DSN |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ | Stripe publishable key (`pk_...`) |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Full site URL (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_GEMINI_API_KEY` | ✅ | Gemini API key (client-side, for Aria WebSocket) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | ✅ | WhatsApp number shown in FloatingDock |
| `NEXT_PUBLIC_THEME` | Optional | Override active theme for static builds |

## Architecture

```
Browser
  ├── Next.js App Router (React 19)
  │     ├── /                   Platform homepage (PlatformHero, DemoShowcase, Pricing)
  │     ├── /templates/[themeId]           Live template stores + product pages + cart
  │     ├── /templates/jewelry/products/   DB-backed owner store (real Stripe checkout)
  │     ├── /products/[slug]    Product detail pages (owner store)
  │     ├── /cart + /checkout   Shopping cart + Stripe Checkout
  │     ├── /dashboard          User account + Aria memories + billing
  │     └── /admin/*            Admin panel (themes, editor, media, components, image-scout)
  │
  ├── FloatingDock (global)
  │     └── Aria orb → Gemini Live WebSocket
  │
  └── Zustand stores (aria, cart, canvas, wishlist, a11y, reportPad)

Server (Next.js API routes)
  ├── /api/auth/*           NextAuth v5 (Google OAuth)
  ├── /api/checkout         Stripe Checkout session creation
  ├── /api/webhooks/stripe  Stripe webhook → order fulfillment
  ├── /api/media/*          Image upload + delete + R2 management
  ├── /api/content/*        Site content draft/publish/snapshot
  ├── /api/admin/*          Admin APIs (products, themes, image-scout)
  └── /api/aria/memory      Aria memory CRUD (paid users only)

Gemini Live (WebSocket, client-side)
  └── useAriaLive.ts → buildAriaConfig(themeId) → live session
        ├── Platform context: knows templates, themes, pricing
        ├── Template context: store-focused, full shopping AI (add to cart, navigate products)
        └── Member context:   personal runtime assistant + debugger; writes to Report Pad

External services
  ├── Neon PostgreSQL  ← Prisma ORM
  ├── Cloudflare R2    ← images (WebP, compressed by Sharp)
  ├── Stripe           ← payments + subscriptions
  ├── Gemini API       ← Aria voice + Image Scout embeddings
  └── Pexels API       ← Image Scout stock photos
```

## Project Structure

```
app/                    Next.js App Router pages and API routes
  admin/                Admin panel pages (themes, editor, media, image-scout, components)
  api/                  API routes (auth, checkout, content, media, aria, admin)
  dashboard/            User account page
  templates/[themeId]/  Live template stores (product listing, product detail, cart)
  templates/jewelry/    DB-backed owner store with real Stripe checkout (force-dynamic)
  products/             Product listing + detail pages (owner store)
components/
  admin/                Admin-specific components (AdminNav, etc.)
  aria/                 AriaCommandDispatcher, ReportPad, ReportPadToggle
  layout/               Navbar, Footer, Providers, ThemeApplier
  platform/             Homepage sections (Hero, DemoShowcase, Pricing)
  template/             TemplateAddToCart — Zustand cart for demo stores
  templates/            TemplateAriaContext — sets ariaContext("template") on mount
  ui/                   Shared UI (FloatingDock, AccessibilityPanel, etc.)
hooks/
  useAriaLive.ts        Gemini Live WebSocket + command execution engine
  useAriaPageContext.ts  Auto-syncs ariaContext from current URL
lib/
  auth.ts               NextAuth config + PrismaAdapter + Site auto-provision
  r2.ts                 Cloudflare R2 client + r2Key() / r2Url() helpers
  compress.ts           Sharp image compression → WebP
  themeImages.ts        resolveTheme() — DB overrides + static fallbacks (server-only)
  ariaChangelog.ts      ARIA_CHANGELOG + buildChangelogPrompt() injected into system prompt
  embeddings.ts         Gemini embedding generation + pgvector search
  slotMap.ts            72 image slot definitions across 8 themes
  pexels.ts             Typed Pexels API wrapper
  validations.ts        Zod schemas for all API inputs
store/
  aria.ts               AriaStore — context ("platform"|"template"|"member"), themeId, memories
  cart.ts               Cart items + total (Zustand persist)
  canvas.ts             Editor canvas state
  reportPad.ts          Session Report Pad — entries, exportMarkdown(), Zustand persist
themes/                 Static theme configs (fallback image URLs, brand data)
prisma/                 Schema + migrations + seed
scripts/                Standalone admin scripts (image migration, scout)
tests/                  Vitest unit tests
```

## Key Features

### Theme System

8 themes (jewelry, candy, bakery, flowers, wine, restaurant, portfolio, saas) each defined in `themes/[id].ts` with brand name, tagline, fonts, colors, hero content, and product catalog. Runtime switching is stored as `SiteContent.active_theme`. `resolveTheme()` merges DB `ThemeImage` overrides on top of static configs — so image slots are replaced with R2 CDN URLs without rebuilding.

### Aria Voice AI

Aria is a persistent Gemini Live WebSocket connection initiated from `useAriaLive.ts`. The system prompt is built dynamically per context (`platform` / `template` / `member`) at connect time and includes the Aria changelog (recent capability upgrades). On page navigation, `useAriaPageContext.ts` sends a silent `turn_complete: false` update so Aria always knows the current URL without reconnecting.

Voice commands span shopping (`navigate_to_product`, `add_to_cart`, `recommend_product`), content editing (`update_site_content`, `switch_theme`), admin navigation, image curation, and session documentation (`write_to_report`, `summarize_session`, `get_changelog`). In member context, Aria acts as a personal runtime assistant and debugger, writing structured test notes to the Session Report Pad.

### Image Scout

An admin tool at `/admin/image-scout` for curating R2 CDN images. Workflow: select theme + slot → search Pexels or Gemini → preview 12 results → accept/reject with reason → click Upload → image is fetched, compressed to WebP, stored in R2, saved to `CdnImage` catalog, and an embedding is generated for future semantic search and deduplication.

### Stripe Checkout

Cart items are sent to `/api/checkout`, which creates a Stripe Checkout Session with line items. After payment, Stripe sends a webhook to `/api/webhooks/stripe` which writes the `Order` and `OrderItem` records. Subscription management uses Stripe Customer Portal via `/api/subscription/portal`.

### Site Editor

The admin editor at `/admin/editor` provides a visual draft/publish content workflow. Content is stored as JSON in `SiteContent` (with `draft` and `live` string fields) and can be edited by Aria voice commands or direct field editing. Snapshots preserve content history.

## Development

### Running locally
```bash
npm run dev        # starts Next.js on port 3000
```

### Running tests
```bash
npm test           # Vitest unit tests (run before every commit)
```

### Linting and type checking
```bash
npm run lint       # Biome lint
npx tsc --noEmit   # TypeScript check — must pass before commit
```

### Database
```bash
npx prisma db push     # sync schema → DB + regenerate client
npx prisma studio      # GUI to browse/edit records
npx prisma db seed     # seed sample products + components
```

### Useful scripts
```bash
npm run validate:themes        # validate all theme configs
npm run migrate:images         # migrate image URLs to R2
npm run upload:approved        # upload approved images in bulk
```

## Admin Panel

Access at `/admin` — protected server-side to `ADMIN_EMAIL` only.

| Section | URL | Purpose |
|---|---|---|
| Dashboard | `/admin` | Order stats, revenue, recent orders |
| Themes | `/admin/themes` | Switch active theme, preview all 8 |
| Editor | `/admin/editor` | Visual content editor (draft/publish) |
| Media | `/admin/media` | Browse + delete R2 images by theme |
| Components | `/admin/components` | Component registry — view all UI components |
| Image Scout | `/admin/image-scout` | AI image curation for CDN slots |

## Deployment

The app deploys to Google Cloud Run via Docker (`Dockerfile` in root). Key notes:
- `SKIP_ENV_VALIDATION=true` during `next build` to avoid env validation at build time
- `openssl` must be installed in the Node Docker image for Prisma
- All Next.js pages use `export const dynamic = "force-dynamic"` — no static caching
- Live service: `https://tal-store-233162846070.europe-west1.run.app`

Google OAuth must have the Cloud Run callback URL registered:
`https://tal-store-233162846070.europe-west1.run.app/api/auth/callback/google`

## Roadmap

| Phase | Status |
|---|---|
| P1 Platform Foundation | ✅ Complete |
| P2 Aria-as-Editor | ✅ Complete |
| P3 Theme Pack Polish | ✅ Complete |
| PP Platform Pivot | ✅ Complete |
| DI Development Infrastructure | ✅ Complete |
| Image Scout CDN Tool | ✅ Complete |
| P4 Atomic Component Library | ✅ Complete |
| P5 Templates + Aria Assistant | ✅ Complete — product pages, Report Pad, changelog |
| EP Editor Platform | 📋 Planned — inline edit overlay on live site |
| IR Infrastructure Readiness | 📋 Planned — Upstash rate limiting, Neon RLS |

See `docs/MASTER-ROADMAP.md` for full details.
