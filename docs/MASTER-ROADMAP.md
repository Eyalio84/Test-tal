# Master Roadmap — Voice-AI Website Builder Platform
# Status tracker across all plan-mode / implementation sessions
# Last updated: 2026-03-11

---

## Vision
A SaaS website builder platform where customers subscribe to get Aria (voice AI).
Aria knows them personally, edits their site by voice, advises on design/content.
Product catalog: full theme-packs (plug & play sites) → atomic components (blank canvas) → AI-app studio.
Business model: API proxy (buy Gemini capacity in bulk, resell via subscription tiers).

### Product Tiers (locked 2026-03-11)

| Tier | Label | What they get |
|------|-------|---------------|
| Basic | **Website + GUI Builder** | Live site + inline edit mode + component palette. No Aria. |
| Pro | **Website + Aria Builder** | Everything in Basic + Aria voice editing of any element |
| Max | **Website + Aria + Assistant** | Everything in Pro + Aria proactive assistant (memory, suggestions) |
| Super Max | **AI App Studio** | Everything in Max + studio-standalone: build custom AI-powered apps |

---

## Admin Feature (added 2026-03-07)
- Super-admin panel visible ONLY when logged in with owner email (env var: ADMIN_EMAIL)
- Enforced server-side: Next.js middleware + API route guards (not just client-side hide)
- Includes: user management, subscription overview, usage/token metrics, theme management
- Security: rate limiting, CSRF protection, server-only email check, no client-side secret exposure

---

## Plan Status

| #  | Plan Name                  | Status      | Key Deliverable                                              |
|----|---------------------------|-------------|--------------------------------------------------------------|
| 1  | Platform Foundation        | ✅ COMPLETE | Admin guard, Stripe subs+webhook, Aria memory, rate limiting  |
| 2  | Aria-as-Editor             | ✅ COMPLETE | Voice editing → SiteContent writes, live preview, undo/redo  |
| 3  | Theme Pack Polish          | ✅ COMPLETE | Runtime theme switching, 8 themes, /themes showcase, /admin/themes |
| PP | Platform Pivot             | ✅ COMPLETE | /demos showcase, multi-tenant Site model, 3-context Aria, member workspace |
| DI | **Development Infrastructure** | ✅ COMPLETE (2026-03-08) | Private CDN, 7 dev tools, 55 tests, storekit-planner plugin |
| ── | **📦 FOUNDATION SEALED**   | closed      | Push: voice editor + themes + dev infra — foundation is done |
| EP | **Editor Platform** (P4+P5+P6) | **IN PROGRESS** | 20+ components + 5 layouts + inline edit overlay → ships as one release |
| 4  | ↳ Atomic Component Library | ✅ COMPLETE (2026-03-11) | Registry, CRUD, showcase, palette, SVG previews, 163 tests  |
| 5  | ↳ Templates + Aria Assistant | ✅ COMPLETE (2026-03-11) | demos→templates, product pages, Report Pad, Aria changelog |
| 6  | ↳ Visual Editor v1 (inline overlay) | PENDING | Edit mode toggle on live site, floating config panels, Aria controlled |
| ── | **📦 PACKAGE POINT A**     | after EP    | Push: GUI Builder tier live — inline editor + palette + layouts |
| IR | Infrastructure Readiness   | PENDING     | Upstash rate-limit, Resend email, pgvector, Neon RLS         |
| 7  | Visual Editor v2           | PENDING     | Aria integrated into canvas, voice + mouse hybrid            |
| 8  | Theme Marketplace UI       | PENDING     | Preview, install, switch themes — the storefront             |
| AI | AI Content Pipeline        | PENDING     | Vercel AI SDK structured generation, Trigger.dev background jobs |
| 9  | Social Integrations        | PENDING     | Instagram Shop, Facebook Catalog/Pixel                       |
| ── | **📦 PACKAGE POINT B**     | after P9    | Push: editor v2 + marketplace + AI content + social          |
| 10 | Admin + Analytics          | PENDING     | PostHog, Axiom, per-customer dashboard, billing portal       |
| CD | Custom Domains             | PENDING     | CF Workers routing, `slug.platform.com`, SSL auto-provision  |
| 11 | More Theme Packs           | ONGOING     | Agency, gym, real estate, 2-3 variants per domain            |
| 12 | Plugin Architecture        | PENDING     | Extension points, third-party plugin API                     |
| ── | **📦 PACKAGE POINT C**     | after P12   | Push: analytics + custom domains + theme packs + plugins     |
| RC | Real-time Collaboration    | PENDING     | Liveblocks, multi-user editing, presence indicators          |
| 13 | Polish + Scale             | PENDING     | Performance, mobile editor, onboarding flow                  |
| **SK** | **StoreKit SDK**       | **PENDING** | `@storekit/sdk` npm package — types + CLI + validators for external builders |
| SM | Super Max / Studio         | PENDING     | studio-standalone integration, AI-app builder (requires SK)  |
| 14 | Launch Prep                | PENDING     | Marketing site, docs, onboarding video, beta invite, GDPR    |
| ── | **📦 PACKAGE POINT D**     | after P14   | Push: final polish + launch-ready build                      |

---

## Plan #1 — Platform Foundation (✅ COMPLETE — 2026-03-07)
### Scope
- [x] Stripe subscriptions: 3 tiers (Basic/Builder/Pro), webhook handler, tier enforcement
- [x] Per-user Aria memory: AriaMemory table (userId, key, value, updatedAt) — Aria reads on connect + save_memory function
- [x] Admin-by-email: ADMIN_EMAIL env var, admin layout server guard, super-admin panel in /admin with gold badge
- [x] Security: in-memory rate limiting (contact: 5/hr, newsletter: 3/hr), server-side session checks
- [x] Customer dashboard: /dashboard — tier badge, order stats, subscription CTA, Aria memories panel
- [x] Schema: WebhookEvent (idempotency), AriaMemory, subscriptionTier/customerId/subscriptionId on User
- [x] TypeScript: types/next-auth.d.ts — session.user.id + session.user.subscriptionTier
- [ ] API proxy layer: Gemini calls proxied through backend, metered per user — DEFERRED to Plan #2
- [ ] PayPal: optional checkout method alongside Stripe — DEFERRED (add after Stripe is tested)

### Model usage note
- Use claude-haiku-4-5 for: boilerplate CRUD routes, seed scripts, type generation, simple utils
- Use claude-sonnet-4-6 for: architecture decisions, Aria integration, security logic, complex components

---

## Plan #2 — Aria-as-Editor (✅ COMPLETE — 2026-03-07)
### Scope
- [x] Extend ARIA_FUNCTIONS: set_hero_text, set_hero_subtitle, set_color, add_section, remove_section, reorder_section, publish_changes, undo, redo
- [x] SiteContent writes: draft/live split — edits write to draft, publish copies draft→live + revalidatePath
- [x] Live preview: `/?draft=1` — editor shows draft values in real-time; EditorClient full-page overlay
- [x] Undo/redo: SiteSnapshot table (max 10 global snapshots), Zustand stack of snapshot IDs, Cmd+Z/Y keyboard shortcuts
- [x] Aria confirms before destructive changes: ConfirmModal + voice "yes"/"no" via ariaTranscript
- [x] Editor UI: /admin/editor — EditorClient + EditorToolbar (Undo/Redo/History/Publish/Draft badge)
- [x] Click-to-edit: inline EditableField components for mouse/touch editing alongside voice
- [x] Auth: Google OAuth fixed (PrismaAdapter requires lowercase relation fields), proxy.ts redirect loop fixed
- [x] Upgraded toasts: dark-themed toast system (toastSuccess, toastError, toastPublish, toastUndo)
- [x] Schema: SiteContent(draft+live+lastEditedBy), SiteSnapshot(id+contentJson+createdAt)

### Architecture locked
- **Content model:** `SiteContent { id, draft, live, lastEditedBy }` — draft-first, publish copies to live
- **Undo/redo:** DB-backed SiteSnapshot IDs in Zustand stacks (not full content in memory)
- **Editor mode gate:** `editorMode: boolean` in Zustand — editor ARIA_FUNCTIONS only active on `/admin/editor`
- **Auth:** Database sessions (PrismaAdapter) — no JWT-based middleware guards

---

## Plan #3 — Theme Pack Polish (✅ COMPLETE — 2026-03-07)
### Scope
- [x] ThemeConfig: added `about { story, values[], team[] }` field to all 5 existing themes
- [x] `getActiveTheme()` server helper: reads SiteContent.live 'active_theme' → env var → 'jewelry' fallback
- [x] app/collections/page.tsx: reads from `getActiveTheme()` — dynamic per-theme collections
- [x] app/about/page.tsx: reads from `getActiveTheme()` — dynamic story, values, team
- [x] hooks/useAriaLive.ts: `buildAriaConfig(themeId)` — ARIA_FUNCTIONS + SYSTEM_PROMPT built at connect time from active theme
- [x] store/aria.ts: `activeThemeId` + `setActiveThemeId` — Zustand tracks active theme
- [x] Providers.tsx: hydrates `activeThemeId` from server on mount (server → client sync)
- [x] `app/api/theme/route.ts`: GET current theme, POST switch theme (auth-guarded)
- [x] ThemeApplier.tsx: switched to `getActiveTheme()` — CSS vars from DB-stored theme
- [x] 3 new themes: restaurant (Maison Dore), portfolio (Studio Noir), saas (Velo) → 8 total
- [x] /admin/themes: visual theme switcher — switch live with one click, accent color swatches
- [x] Admin dashboard: theme shortcut card showing active theme + link to switcher
- [x] /themes: public showcase of all 8 themes with images and color palettes
- [x] /themes/[id]: per-theme preview — hero, aria config, colors, story, products sample

### Architecture locked
- **Runtime switching:** SiteContent key 'active_theme' — switch theme without rebuild
- **Aria config:** `buildAriaConfig(themeId)` builds ARIA_FUNCTIONS + SYSTEM_PROMPT at connect time
- **Server→client hydration:** RootLayout reads theme → passes to Providers → `useEffect` sets Zustand
- **8 themes:** jewelry, candy, bakery, flowers, wine, restaurant, portfolio, saas

---

## Platform Pivot — Scope (✅ COMPLETE — 2026-03-07)
- [x] Platform homepage: dark hero, 8-theme demo grid, 3-tier pricing
- [x] Demo routes: /demos/[themeId]/ — isolated live demos, no DB reads, generateStaticParams
- [x] Context-aware Navbar: platform / demo / member / store modes
- [x] ThemeApplierStatic: prop-driven CSS var injection for demo isolation
- [x] Prisma: Site model (multi-tenant), siteId on SiteContent/SiteSnapshot/Product
- [x] Auto-provision Site on first login (auth.ts session callback)
- [x] Member workspace: 3-col dashboard, site overview, Aria invite panel
- [x] Content API: siteId-scoped reads with global fallback
- [x] Aria three-context persona: platform guide / demo store / member builder
- [x] Platform footer + context-aware ShippingBanner
- [x] ariaContext Zustand field + setAriaContext action

---

## Development Infrastructure (✅ COMPLETE — 2026-03-08)

This is not a product feature — it is the tooling layer that makes all future development
safer, faster, and measurably more cost-efficient. Completed in a single session.

### Private CDN — Cloudflare R2
- [x] All 72 theme image slots migrated from ephemeral Unsplash URLs to permanent Cloudflare R2
- [x] 6 broken Unsplash 404s replaced with verified Pexels CDN URLs
- [x] `scripts/migrate-images.ts` — resilient migration script with force flag and counter fix
- [x] `lib/r2.ts` — `r2Key()` / `r2Url()` helpers, env.ts-backed config
- [x] `resolveTheme()` — DB `ThemeImage` records override static fallbacks at runtime
- [x] `next.config.ts` — Pexels + `*.r2.dev` added to Next.js `remotePatterns`
- **Why it matters:** Unsplash photo IDs can be deleted by their authors at any time.
  Every image on the platform now lives on infrastructure we control, at a permanent URL,
  compressed to WebP, cached with immutable headers. No external dependency on image hosting.

### Development Tooling Layer (7 tools)
All installed, configured, tested, and documented in `docs/tools/`.

| Tool | Purpose | Key file |
|------|---------|---------|
| @t3-oss/env-nextjs | Type-safe env vars validated with Zod at startup | `env.ts` |
| Zod | API input validation — all routes validated before DB touch | `lib/validations.ts` |
| Biome v2 | Linter + formatter replacing ESLint + Prettier | `biome.json` |
| Sharp | WebP compression before every R2 upload | `lib/compress.ts` |
| Sentry | Error monitoring — automatic in prod, disabled in dev | `sentry.*.config.ts` |
| Vitest | Unit test runner — 55/55 tests passing | `tests/lib/*.test.ts` |
| TanStack Query | Server state — admin media page migrated from manual fetch | `app/admin/media/page.tsx` |

- [x] `CLAUDE.md` — project conventions, tool index, pre/post launch checklist
- [x] `docs/tools/` — 8 reference docs (README + one per tool + image-scout)
- [x] 55 passing tests: `r2.test.ts`, `theme.test.ts`, `compress.test.ts`
- [x] TypeScript clean: `npx tsc --noEmit` passes

### storekit-planner Plugin (Claude Code enhancement)
This is tooling for the development workflow — not part of the StoreKit app.
Lives at `~/.claude/plugins/marketplaces/storekit-planner/`.

- [x] **Phase 1:** `haiku-benchmark` skill — 5-tier capability benchmark for Haiku 4.5
- [x] **Benchmark result:** 5/5 tiers PASS. Haiku 4.5 handles cross-file reasoning
  and architectural decisions that were originally assumed to be Sonnet-only territory.
  Full report: `.claude/plans/haiku_benchmark_20260308T162709Z.md`
- [x] **Phase 2:** `sp-plan` skill, `hybrid-execute` skill, `storekit-scout` agent,
  `/sp-plan` command, `docs/generalization-guide.md`
- [x] Plugin v2.0.0 — smoke test PASS (7/7 tasks)

**Why it matters:** Every future implementation plan is now written by a scout-first
workflow that labels each task with an evidence-based `model-hint: haiku|sonnet`.
Cross-file reasoning tasks (previously Sonnet) are now Haiku → ~4x cheaper and faster
for the majority of tasks in any planning workflow.

---

## EP — Editor Platform (IN PROGRESS — P4 batches 1-7 done)
> P4 + P5 + P6 merged into one coordinated release.
> Ships as a single coherent milestone so the Basic-tier GUI builder is a complete product.
> Tier gating: Basic = full editor + palette · Pro = + Aria voice on canvas · Max = + Aria proactive suggestions

---

## Plan #4 — Atomic Component Library (✅ COMPLETE — 2026-03-11)
(Atomic components serve the member zone: dashboard, editor, settings)

### Architecture locked (2026-03-09)
- `Component` Prisma model: id, slug, name, category, propsSchema, previewImage, ariaName
- Admin CRUD: `/admin/components`
- Public showcase: `/components`
- Editor palette: `/dashboard/editor` — drag-to-place from sidebar
- Aria receives full component catalog on connect → executes by voice: "add testimonial card after hero"

### Remaining (Batches 8-9)
- [ ] **Batch 8 (Task 5.1):** SVG preview generation script + R2 upload for all components
- [ ] **Batch 8 (Task 5.2):** Smoke test — palette renders, drag-to-place fires, Aria "add X" works
- [ ] **Batch 9 (Task 6.1):** Integration tests — palette → canvas → save → publish full flow

### Original Scope
- [ ] Buttons: 10 variants (primary, ghost, outline, pill, icon, loading, etc.)
- [ ] Inputs: text, email, password, search, textarea, with validation states
- [ ] Dropdowns: select, multi-select, combobox
- [ ] Sliders: range, color picker, opacity
- [ ] Badges, tags, chips
- [ ] Cards: product, testimonial, pricing, stat, feature
- [ ] Navigation: nav bars, sidebars, breadcrumbs, tabs, pagination
- [ ] Overlays: modals, drawers, tooltips, popovers
- [ ] Standard props interface: every component accepts { id, styles, content, ariaLabel }
- [ ] Component registry: catalog file Aria can reference by name

---

## Plan #5 — Templates + Aria Personal Assistant (✅ COMPLETE — 2026-03-11)

### Aria's Dual Role (locked 2026-03-11)
- **Customer-facing:** Theme-specific shopping assistant with full product navigation, cart, and recommendations
- **Owner-facing:** Personal runtime assistant, developer companion, and test session documenter
  - Aria documents test sessions → Report Pad → export as .md → paste to coordinator (Claude Code)
  - Aria knows her own changelog → answers "what's new?" / "what can you do?"
  - Aria proactively logs observations, bugs, and navigation during owner test sessions

### Scope
**Templates (rename + upgrade from demos):**
- [ ] Rename `/demos` → `/templates` throughout codebase (routes, nav, Aria context, copy)
- [ ] `ariaContext` type: `"demo"` → `"template"` everywhere
- [ ] Individual product pages for all 8 templates: `app/templates/[themeId]/products/[slug]/page.tsx`
- [ ] Link product cards in template product listings → detail pages
- [ ] `TemplateAddToCart` component: Zustand cart, no Stripe, "Create your store" CTA at checkout
- [ ] Template cart page: `app/templates/[themeId]/cart/page.tsx`
- [ ] Jewelry template override: `app/templates/jewelry/*` → DB-backed (real cart, real checkout)
- [ ] `navigate_to_product` Aria function: context-aware (`/templates/[themeId]/products/[slug]` vs `/products/[slug]`)

**Aria Changelog:**
- [ ] `lib/ariaChangelog.ts` — structured capability log with date + version + description
- [ ] Injected into system prompt in `buildAriaConfig()`
- [ ] `get_changelog` Aria function — answers "what's new?" / "what are your latest upgrades?"

**Session Report Pad:**
- [ ] `store/reportPad.ts` — Zustand store with entries, timestamps, export
- [ ] `components/aria/ReportPad.tsx` — floating panel, bottom-left, collapsible
- [ ] Entry types: observation | bug | navigation | test | summary | aria_note (color-coded)
- [ ] Export: copy to clipboard + download as `.md` file
- [ ] `write_to_report(text, type)` Aria function — available in ALL contexts
- [ ] `clear_report` Aria function
- [ ] `summarize_session` Aria function — generates structured session summary
- [ ] Aria instructed to proactively document during owner test sessions

Full plan: `docs/plans/2026-03-11-p5-templates-aria-assistant.md`

---

## Plan #6 — Visual Editor v1 — Inline Overlay (PENDING)
**Model (locked 2026-03-11): Inline edit overlay on the live site.**
The live site runs normally. "Edit Mode" toggle (floating, top-right) activates overlay.
In edit mode: clicking any section/element opens a floating config panel *instead* of navigating.
Config panels pipeline to: R2 image swap, text edit, color picker, link editor, metadata, remove.
All edits route through existing draft → publish flow (Plan #2). Aria always available.

### Scope
- [ ] `EditModeProvider` — Zustand context: `editMode: boolean`, `selectedElement: string | null`
- [ ] `EditModeToggle` — floating button (top-right), persists to sessionStorage
- [ ] `EditOverlay` — wrapper that intercepts clicks in edit mode, prevents default navigation
- [ ] `FloatingConfigPanel` — portal-rendered panel docked to selected element position
- [ ] Config panel modules: ImagePicker (→ R2 pipeline), TextEditor, ColorPicker, LinkEditor, MetaEditor
- [ ] Component palette drawer (left-side, collapsible — reuses P4 component registry)
- [ ] Tier guard: Aria voice commands in edit mode locked behind Pro tier CTA
- [ ] Save/publish flow: all edits route through existing SiteContent draft → live pipeline

---

## Plan #7 — Visual Editor v2 (PENDING)
### Scope
- [ ] Aria integrated into canvas: "add a testimonials section after the hero"
- [ ] Voice + mouse hybrid: Aria suggests, user confirms with click or voice
- [ ] Aria sees canvas state (knows which components exist, their order)
- [ ] Aria can select, move, edit, delete components by voice

---

## Plan #8 — Theme Marketplace UI (PENDING)
/demos is the theme marketplace — foundational work done in Platform Pivot
### Scope
- [ ] /themes route: grid of all available theme packs
- [ ] Theme card: preview image, name, domain, Aria voice/personality preview
- [ ] Install flow: pick theme → preview → confirm → seed DB → rebuild or revalidate
- [ ] Switch theme: owner can switch active theme from dashboard
- [ ] Paid themes: some theme packs behind higher subscription tier

---

## Plan #9 — Social Integrations (PENDING)
### Scope
- [ ] Instagram Shop sync: connect IG account, import product catalog, auto-update stock
- [ ] Facebook Catalog: product feed for Facebook/Instagram ads
- [ ] Facebook Pixel: conversion tracking on add-to-cart and checkout
- [ ] WhatsApp Business API: upgrade from simple wa.me link to proper Business API
- [ ] Google Analytics 4: event tracking

---

## Plan #10 — Admin + Analytics Dashboard (PENDING)
### Scope
- [ ] Super-admin (/admin with ADMIN_EMAIL guard): all customers, usage, revenue, churn
- [ ] Per-customer dashboard: their site stats, Aria usage, subscription status
- [ ] Token usage meter: show customer how many Aria calls used this month
- [ ] Billing portal: Stripe customer portal for self-service subscription management

---

## Plan #11 — More Theme Packs (ONGOING)
### Scope — ongoing across sessions
- [x] Restaurant / café — Maison Dore (amber, Cormorant, Elise/Aoede)
- [x] Photography portfolio — Studio Noir (monochrome, Playfair, Noir/Charon)
- [x] SaaS landing page — Velo (violet, Lexend, Velo/Puck)
- [ ] Creative agency
- [ ] Gym / fitness studio
- [ ] Real estate listings
- [ ] Multiple variants per domain (2-3 per category)
- [ ] Each needs: brand, colors, fonts, Aria personality, 8+ products/services, hero, collections

---

## Plan #12 — Plugin Architecture (PENDING)
### Scope
- [ ] Plugin interface spec: { name, version, ariaFunctions[], components[], routes[] }
- [ ] Plugin registry: installable from URL or marketplace
- [ ] Aria function extension: plugins can add new voice commands
- [ ] Component extension: plugins can add new component types to palette
- [ ] Revenue share: paid plugins, Eyal takes % of marketplace sales

---

## Plan #13 — Polish + Scale (PENDING)
### Scope
- [ ] Mobile editor: touch-friendly canvas, gesture controls
- [ ] Onboarding flow: "what kind of business?" → auto-select theme → Aria intro tour
- [ ] Performance: image optimization, edge caching, Core Web Vitals audit
- [ ] Aria response latency: optimize WebSocket connection pooling
- [ ] Error recovery: graceful degradation when Aria/API is unavailable

---

## Plan #14 — Launch Prep (PENDING)
### Scope
- [ ] Marketing site (separate from builder — the product's own landing page)
- [ ] Documentation site
- [ ] Onboarding video / Aria walkthrough
- [ ] Beta invite system
- [ ] Support system (Intercom or similar)
- [ ] Terms of service, privacy policy, GDPR compliance

---

## IR — Infrastructure Readiness (PENDING)
> Research-identified gaps (2026-03-11). Priority: security → table stakes → differentiators.

### Priority 1 — Security (before next feature ships)
- [ ] **Upstash Redis + @upstash/ratelimit** — `/api/media/upload` currently unprotected (already in CLAUDE.md)
  Rate limits: 10 req/min per user on upload, 5 Gemini WebSocket connections per user
  `npm install @upstash/redis @upstash/ratelimit`
- [ ] **Neon Row-Level Security** — currently only app-level `siteId` filter. A missed WHERE leaks tenant data.
  Pattern: `SET app.current_tenant = :siteId` + RLS policies on SiteContent, SiteSnapshot, Product, ThemeImage

### Priority 2 — Table Stakes SaaS
- [ ] **Resend** — no transactional email exists today. `npm install resend`
  Integrate with: NextAuth new user callback (welcome), Stripe webhook (purchase confirm), onboarding drip
  Cost: free to 3k emails/mo
- [ ] **pgvector on Neon** — `lib/embeddings.ts` already started (untracked). Enable extension + migration.
  Use for: Aria semantic component search, page similarity, "something like a testimonial but for products"
  Cost: free (already on Neon)

### Priority 3 — Capability Unlocks
- [ ] **Meilisearch** (Cloud or self-hosted Fly.io) — admin full-text search for components, products, pages
  Postgres ILIKE breaks on typos and doesn't rank. Cost: free self-hosted or ~$30/mo cloud.

---

## AI — AI Content Pipeline (PENDING)
- [ ] **Vercel AI SDK** — `streamText` + `generateObject` for structured AI output
  Use for: SEO meta generation, product descriptions, alt-text on image upload, copy suggestions
  Works with Gemini (same API key as Aria). `npm install ai @ai-sdk/google`
- [ ] **Trigger.dev** — background jobs with retry logic (already in CLAUDE.md)
  Jobs: new site provisioning, bulk alt-text on upload, onboarding email sequence, nightly health checks
  `npm install @trigger.dev/sdk`
- [ ] Per-tier AI generation quota: Basic = 10/mo, Pro = 100/mo, Max = unlimited

---

## CD — Custom Domains (PENDING)
> Key differentiator — a website builder without per-tenant domains is incomplete.
- [ ] **Cloudflare Workers** — `slug.platform.com` → tenant lookup at edge (no origin hit)
  Workers KV maps slug → siteId. Add `Site.slug` field (unique, user-chosen).
  Cost: ~$5/mo Workers Paid plan
- [ ] Custom domain flow: tenant enters `mybrand.com` in dashboard → CNAME DNS verification → CF handles SSL
- [ ] Preview URLs: each draft gets a `/preview/[token]` URL before publish (no Workers needed)

---

## RC — Real-time Collaboration (PENDING)
> Only needed once multi-user editing is validated by real users. Do not build speculatively.
- [ ] **Liveblocks** — best fit: CRDT semantics prevent site corruption on concurrent edits
  `useMyPresence` for cursors, `useStorage` for shared canvas state (integrates with Zustand store)
  Cost: free to 50 MAU, then ~$30/mo
- [ ] Presence indicators: highlight border on sections currently being edited by another user
- [ ] Conflict resolution: CRDT handles automatic merge, no "last write wins" data loss

---

## SK — StoreKit SDK (PENDING)
> The foundation is already built. This plan extracts it into a public, typed interface.
> Prerequisite for: SM (Super Max studio), PA (plugin marketplace), external developer ecosystem.

### Why it's natural — what's already there
The SDK isn't a new idea — it's the formalization of patterns that already exist:
- `Component` model has `propsSchema: Json` — a typed component interface already exists
- `ariaName` on every component — Aria function registration protocol already exists
- `buildAriaConfig(themeId)` in `hooks/useAriaLive.ts` — theme extension point already exists
- `ARIA_FUNCTIONS` array — structured function manifest already exists
- `{ id, styles, content, ariaLabel }` standard props interface — already in P4 spec

The SDK makes these contracts public, typed, and packageable.

### What the SDK delivers
- `@storekit/sdk` npm package (private initially, public when marketplace launches):
  - TypeScript types: `StoreKitComponent`, `StoreKitTheme`, `AriaFunction`, `PropsSchema`
  - `defineComponent(config)` helper — validates against propsSchema at build time
  - `defineTheme(config)` helper — validates theme config shape (colors, fonts, Aria persona)
  - `defineAriaFunction(config)` helper — validates Aria function manifest structure
  - Zod validators for each (reuse `lib/validations.ts` patterns)
- CLI: `npx create-storekit-component` — scaffolds a component folder with typed template
- Public API route: `GET /api/sdk/components` — returns component registry as JSON (for external tools)

### Scope
- [ ] Extract types to `lib/sdk/types.ts` — `StoreKitComponent`, `StoreKitTheme`, `AriaFunction`
- [ ] Create `lib/sdk/define.ts` — `defineComponent()`, `defineTheme()`, `defineAriaFunction()` with Zod validation
- [ ] Create `lib/sdk/validators.ts` — reusable validators, extend existing `lib/validations.ts`
- [ ] `GET /api/sdk/components` route — public component registry (auth-optional, returns catalog)
- [ ] `GET /api/sdk/themes` route — public theme manifest (slug, colors, fonts, ariaPersonality)
- [ ] CLI scaffold script (`scripts/create-component.ts`) — interactive template generator
- [ ] `docs/sdk/README.md` — SDK contract documentation (the public API surface)
- [ ] Package.json exports — `@storekit/sdk` as a local package, publishable to npm later

### Tier note
- The SDK itself is infrastructure — not tier-gated
- Third-party components in the marketplace: accessible by Pro+ tier
- Building custom SDK components: Super Max tier workflow via studio-standalone

---

## SM — Super Max / Studio (PENDING)
> Long-horizon. Requires SK + CD + IR complete first. Ships as Super Max tier only.
> SK (StoreKit SDK) is a prerequisite — AI-generated components must comply with SDK types.

**Architecture pattern (informed by Bolt.new + v0 research, 2026-03-11):**
- Bolt.new: StackBlitz WebContainers (in-browser Node.js) — most powerful, heaviest
- v0.dev: API bridge (server-side LLM call → stream TSX → render) — pragmatic starting point
- **StoreKit v1 path:** API bridge → server-side esbuild compile → sandboxed preview iframe → user approves → `next/dynamic` load from R2 in tenant store

**Security non-negotiables:**
- Preview iframe on separate subdomain (`preview.storekit.com`) + `sandbox="allow-scripts"` (no `allow-same-origin`)
- Server-side AST pass (via `@babel/parser`) before storage: reject `eval`, `Function()`, `fetch` to non-allowlisted domains
- CSP on preview subdomain: `default-src 'self'; script-src 'self'; connect-src 'none'`
- Compile server-side, never runtime `eval` in production

**Scope:**
- [ ] Studio route: `/dashboard/studio` (Super Max tier only, tier-gated)
- [ ] Shared auth: NextAuth session JWT via postMessage to studio iframe
- [ ] Component pipeline: generate → esbuild compile → AST validate → store in R2 → available in palette
- [ ] Aria bridge: generated components get `ariaName`, accessible by voice
- [ ] Custom AI-app builder: Super Max can build + deploy AI microapps on their store page

---

## UI/UX Decisions (locked 2026-03-07)
- **Aria interface:** Floating orb (bottom-right) — same orb owners know from shopping experience
- **Dashboard first view:** Live site preview center + pages list left sidebar + Aria right sidebar
- **Component palette desktop:** Left collapsible drawer, categories with expand/collapse
- **Component palette mobile:** Bottom sheet slides up from [+] button, touch-friendly category tabs
- **Theme switching:** Instant preview toggle — /themes grid, hover previews iframe, click to apply

---

## Aria Role & Contexts (updated P5 — 2026-03-11)

### Contexts
- `"platform"` — `/` homepage: knows templates, themes, pricing, about
- `"template"` — `/templates/[themeId]` (renamed from "demo"): full shopping AI — navigate, cart, recommend, describe products
- `"member"` — `/dashboard` + admin: **personal runtime assistant + debugger**

### Aria's Owner Role (P5+)
Aria is the owner's personal runtime assistant during development and production:
- Navigate anywhere on the platform by voice command
- Document test sessions in real-time → `write_to_report` → export `.md` → paste to coordinator (Claude Code)
- Answer "what are your capabilities?" / "what's new?" from live `ARIA_CHANGELOG`
- Proactively log bugs, observations, and navigation during testing sessions
- Generate structured session summaries on request (`summarize_session`)
- Report Pad lives bottom-left of screen (opposite Aria orb) — floating, collapsible, persistent

---

## Key Technical Decisions (locked)
- Next.js 16 App Router — server components default
- Prisma v5 + Neon PostgreSQL — type-safe ORM
- NextAuth v5 — auth foundation (already built)
- Zustand — client state
- Stripe primary + PayPal secondary for billing
- Gemini Live API for Aria voice (WebSocket)
- CSS variables for theming (--theme-accent etc.)
- NEXT_PUBLIC_THEME env var for build-time theme selection
- Admin guard: ADMIN_EMAIL env var, enforced in Next.js middleware + API routes

## Model Usage Policy (empirically calibrated 2026-03-08)

Haiku 4.5 was benchmarked against real StoreKit code across 5 capability tiers.
All 5 tiers passed. The policy below reflects that data, not marketing claims.
Full evidence: `.claude/plans/haiku_benchmark_20260308T162709Z.md`
Full guide: `~/.claude/plugins/marketplaces/storekit-planner/docs/generalization-guide.md`

| Task class | Model | Basis |
|-----------|-------|-------|
| File search, glob, grep, count | **Haiku** | T1: 4/4 benchmark |
| Single-file edit (fully specified) | **Haiku** | T2: 6/6, tsc clean |
| Test generation (+ "use static imports" note) | **Haiku** | T3: logic PASS, style caveat |
| Cross-file execution trace | **Haiku** | T4: exceeded expectations |
| Architectural trade-off Q&A | **Haiku** | T5: senior-review quality |
| CRUD routes, seed scripts, boilerplate | **Haiku** | T1-T2 class |
| Writing implementation plans (this skill itself) | **Sonnet** | Meta-level, untested |
| Architecture decisions, Aria integration, security | **Sonnet** | Judgment + implicit context |
| Ambiguous open-ended design docs | **Sonnet** | No reference structure |
| Bulk content generation (theme copy, product descriptions) | **Gemini 2.5 Flash** | Cost + speed |
