# Blind-Spot Audit — Infrastructure & Tooling Map
# Researched: 2026-03-11 | Status: reference document

This document maps tools and services the platform should consider adopting,
organized by priority. Cross-reference with IR/AI/CD/RC/SM plans in MASTER-ROADMAP.md.

---

## 🔴 Immediate — Security Gap (ship before next feature)

### Upstash Redis + @upstash/ratelimit
- **Gap:** `/api/media/upload` is unprotected. Any user can spam it → R2 costs spike.
  Gemini WebSocket has no per-user concurrency limit either.
- **Install:** `npm install @upstash/redis @upstash/ratelimit`
- **Rate limits to apply:**
  - `/api/media/upload` → 10 req/min per userId
  - Gemini WebSocket connections → 5 concurrent per userId
- **Cost:** Free to 10k req/day. ~$0 for early traffic.
- **Already in:** CLAUDE.md pre-launch checklist.

### Neon Row-Level Security
- **Gap:** Multi-tenant isolation relies entirely on app-level `WHERE siteId = x`.
  A single missing WHERE clause exposes all tenants' data.
- **Fix:** Enable RLS in Neon Postgres. Set `app.current_tenant` on each connection.
  Apply policies on: `SiteContent`, `SiteSnapshot`, `Product`, `ThemeImage`.
- **Cost:** Free — RLS is a Postgres native feature, Neon supports it.
- **Complexity:** Medium (2-3 days to add policies + integration tests).

---

## 🟡 Table Stakes — SaaS Basics (before first paying customer)

### Resend (transactional email)
- **Gap:** No transactional email exists. No welcome email, no purchase confirmation,
  no onboarding drip. Every SaaS customer expects email confirmation on signup.
- **Install:** `npm install resend`
- **Trigger points:**
  1. `auth.ts` session callback (new user) → welcome + onboarding sequence
  2. Stripe webhook `checkout.session.completed` → purchase confirmation
  3. Stripe webhook `customer.subscription.deleted` → cancellation email
- **Cost:** Free to 3,000 emails/mo. $20/mo after.

### pgvector on Neon
- **Gap:** `lib/embeddings.ts` is already started (untracked file). Enable the extension.
- **Why:** Aria can semantically search components ("something like a testimonial but simpler"),
  find similar pages, and match user intent to template without keyword matching.
- **Setup:** `CREATE EXTENSION IF NOT EXISTS vector;` + Prisma migration to add
  `embedding Unsupported("vector(1536)")` column to `Component` and `Page` models.
- **Cost:** Free — pgvector is built into Neon.
- **Model to use:** `text-embedding-004` (Gemini) — already have the API key.

---

## 🟢 Capability Unlocks (after Editor Platform ships)

### Vercel AI SDK
- **Gap:** Beyond Gemini Live for voice, there is no structured AI content generation.
  No SEO meta, no product description drafts, no alt-text on image upload.
- **Install:** `npm install ai @ai-sdk/google`
- **Use `generateObject` with Zod schemas for:**
  - `{ title, description, keywords }` — SEO meta generation per page
  - `{ name, price, description }` — product import enrichment
  - `{ altText }` — auto-generated on every R2 image upload
- **Cost:** Free library. Pay model tokens only (Gemini 2.0 Flash is cheapest for this).

### Trigger.dev (background jobs)
- **Gap:** Long-running tasks currently block API responses or don't exist at all.
- **Install:** `npm install @trigger.dev/sdk`
- **Jobs to create:**
  1. `new-site-provisioning` — triggered after first login (seed default content)
  2. `bulk-alt-text-generation` — on R2 upload batch, backfill existing images
  3. `onboarding-email-sequence` — day 1, day 3, day 7 emails after signup
  4. `nightly-health-check` — verify all tenant sites resolve, R2 URLs live
- **Cost:** Free self-hosted. $20/mo managed cloud.
- **Already in:** CLAUDE.md pre-launch checklist.

### Meilisearch (full-text search)
- **Gap:** Admin search for components, products, pages is non-existent.
  Postgres ILIKE is brittle (no typo tolerance, no ranking).
- **Self-hosted on Fly.io** is free. Meilisearch Cloud: ~$30/mo.
- **Index:** `components` (name, category, ariaName), `products` (name, description),
  `pages` (title, slug, content summary).
- **Note:** pgvector handles semantic/Aria search. Meilisearch handles typo-tolerant admin search.
  They're complementary, not competing.

---

## 🔵 Differentiators (competitive moat, after 50+ active users)

### Cloudflare Workers — Custom Domains & Edge Routing
- **Gap:** A website builder without per-tenant custom domains is incomplete.
  Every competitor (Shopify, Squarespace, Wix) gives `mybrand.com`.
- **Architecture:**
  1. Add `Site.slug` field (user-chosen, unique) — `slug.yourdomain.com` is the free subdomain
  2. Workers KV maps `slug → siteId` for edge lookups without hitting Cloud Run
  3. Custom domain: tenant sets CNAME → CF verifies ownership → CF issues SSL auto
- **Cost:** ~$5/mo Workers Paid + $0.50/mo per custom domain (Cloudflare handles SSL).
- **CDN bonus:** Workers Cache API can serve entire tenant pages in <10ms globally,
  eliminating Cloud Run cold starts for read traffic.

### PostHog (product analytics)
- **Gap:** No data on which themes get demoed most, which Aria commands are used,
  or where users drop off in the onboarding funnel.
- **Install:** `npm install posthog-js posthog-node`
- **Events to track:**
  - `theme_demo_view` (themeId) — which demos get traffic
  - `aria_session_start` (context, themeId) — voice engagement
  - `edit_mode_toggle` — GUI builder usage
  - `component_placed` (componentSlug) — palette usage
  - `checkout_initiated` / `subscription_created` (tier) — conversion
- **Cost:** Free to 1M events/mo.
- **Already in:** CLAUDE.md post-launch checklist.

### Axiom (structured logging)
- **Gap:** `console.log` goes to Google Cloud Logging but isn't queryable by tenant/user.
  When a tenant reports "my site broke", there's no way to find their specific logs.
- **Install:** `npm install next-axiom`
- **Log format:** `{ tenantId, userId, route, duration, statusCode, error? }`
- **Cost:** Free 30-day retention. ~$25/mo after.
- **Already in:** CLAUDE.md post-launch checklist.

---

## 🟣 Long-Horizon (Super Max tier — 12+ months)

### StackBlitz WebContainers
- **Why:** Bolt.new runs a full Node.js process in the browser via WASM.
  This enables the studio-standalone "AI writes full Next.js files, runs npm install" dream.
- **When:** Only needed for Super Max tier full-stack app generation.
  For Super Max v1, use the lighter API bridge pattern (see SM plan in MASTER-ROADMAP.md).

### Liveblocks (real-time collaboration)
- **Why:** CRDT semantics prevent site corruption when two users edit simultaneously.
  Yjs + HocusPocus gives more control but requires running a server.
  Socket.io/Pusher are generic and have no conflict resolution — don't use for canvas.
- **When:** Only worth building when you have multi-user teams as customers.
  Adds ~$30/mo at scale but is a significant acquisition differentiator for agencies.

---

## Summary — What to do and when

| When | Action |
|------|--------|
| **Now (before EP ships)** | Upstash rate limiting + Neon RLS |
| **Before first paying user** | Resend transactional email |
| **After Editor Platform** | pgvector, Vercel AI SDK, Trigger.dev |
| **After 50 active users** | PostHog, Axiom, Cloudflare Workers custom domains |
| **After 200 active users** | Meilisearch, Prisma Accelerate |
| **When teams become customers** | Liveblocks |
| **Super Max tier v1** | API bridge + esbuild + sandboxed iframe (see SM plan) |
| **Super Max tier v2** | WebContainers (full Bolt.new pattern) |
