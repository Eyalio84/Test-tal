# Master Roadmap — Voice-AI Website Builder Platform
# Status tracker across all plan-mode / implementation sessions
# Last updated: 2026-03-07

---

## Vision
A SaaS website builder platform where customers subscribe to get Aria (voice AI).
Aria knows them personally, edits their site by voice, advises on design/content.
Product catalog: full theme-packs (plug & play sites) → atomic components (blank canvas).
Business model: API proxy (buy Gemini capacity in bulk, resell via subscription tiers).

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
| ── | **📦 PACKAGE POINT A**     | after P3    | Push: foundation + voice editor + themes baseline            |
| 4  | Atomic Component Library   | PENDING     | 30-50 components, standard interface, browsable catalog      |
| 5  | Page Layout Library        | PENDING     | 10-15 blank layouts, blank canvas mode                       |
| 6  | Visual Editor v1           | PENDING     | Drag/place/resize components, no-code editing                |
| ── | **📦 PACKAGE POINT B**     | after P6    | Push: component library + layouts + visual editor v1         |
| 7  | Visual Editor v2           | PENDING     | Aria integrated into canvas, voice + mouse hybrid            |
| 8  | Theme Marketplace UI       | PENDING     | Preview, install, switch themes — the storefront             |
| 9  | Social Integrations        | PENDING     | Instagram Shop, Facebook Catalog/Pixel                       |
| ── | **📦 PACKAGE POINT C**     | after P9    | Push: editor v2 + marketplace + social integrations          |
| 10 | Admin + Analytics          | PENDING     | Per-customer dashboard, usage, billing management            |
| 11 | More Theme Packs           | ONGOING     | Restaurant, portfolio, SaaS, agency, multiple per domain     |
| 12 | Plugin Architecture        | PENDING     | Extension points, third-party plugin API                     |
| ── | **📦 PACKAGE POINT D**     | after P12   | Push: admin dashboard + theme packs + plugin system          |
| 13 | Polish + Scale             | PENDING     | Performance, mobile editor, onboarding flow                  |
| 14 | Launch Prep                | PENDING     | Marketing site, docs, onboarding video, support system       |
| ── | **📦 PACKAGE POINT E**     | after P14   | Push: final polish + launch-ready build                      |

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

## Plan #4 — Atomic Component Library (PENDING)
(Atomic components now serve the member zone: dashboard, editor, settings)
### Scope
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

## Plan #5 — Page Layout Library (PENDING)
### Scope
- [ ] 15 blank layout structures (full-width, sidebar-left, sidebar-right, 2-col, 3-col, hero+grid, etc.)
- [ ] Blank canvas mode: /builder route, empty page, component palette on left
- [ ] Layout picker: visual grid of layout previews on new page creation
- [ ] Section slots: named drop zones (hero, features, cta, footer, etc.)

---

## Plan #6 — Visual Editor v1 (PENDING)
Visual editor lives at /dashboard/editor
### Scope
- [ ] **Inline "Edit Mode" on the running website** — toggle activates an overlay on the live site; clicking any section reveals edit controls in-place; changes go through existing draft→publish flow (Plan #2). This is the "mock look-alike that saves to the actual site" concept.
- [ ] Drag to place components from palette
- [ ] Resize handles on selected component
- [ ] Move (reorder sections via drag)
- [ ] Click to edit text inline (extends the inline edit mode above)
- [ ] Property panel (right sidebar): colors, spacing, font size for selected component
- [ ] Save/publish flow

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

## UI/UX Decisions (locked 2026-03-07)
- **Aria interface:** Floating orb (bottom-right) — same orb owners know from shopping experience
- **Dashboard first view:** Live site preview center + pages list left sidebar + Aria right sidebar
- **Component palette desktop:** Left collapsible drawer, categories with expand/collapse
- **Component palette mobile:** Bottom sheet slides up from [+] button, touch-friendly category tabs
- **Theme switching:** Instant preview toggle — /themes grid, hover previews iframe, click to apply

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

## Model Usage Policy (cost optimization)
- claude-haiku-4-5: CRUD routes, seed scripts, type generation, simple utils, boilerplate
- claude-sonnet-4-6: architecture, Aria integration, security, complex UI, decisions
- Gemini 2.5 Flash: bulk content generation (theme copy, product descriptions)
