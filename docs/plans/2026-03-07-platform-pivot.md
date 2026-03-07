# Platform Pivot Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the current single-store demo into a web-dev AI SaaS platform — the company's public face, a demo browser for all 8 themes, and a per-member site workspace powered by Aria.

**Architecture:** Three-layer routing — `/` platform homepage, `/demos/[themeId]` isolated live demos, `/dashboard` member workspace. Multi-tenant `Site` model scopes all content, products, and snapshots per member. Aria operates in three personas: platform guide (marketing), site builder (member zone), and storefront assistant (inside demos).

**Tech Stack:** Next.js 16 App Router, Prisma v5 + Neon PostgreSQL, Zustand, NextAuth v5, Tailwind CSS, Gemini Live API (Aria), Stripe (billing tiers)

---

## Context — key files

| File | Current role | After pivot |
|------|-------------|-------------|
| `app/page.tsx` | Jewelry store homepage | Platform homepage (dark, premium) |
| `app/products/page.tsx` | Shop (DB products) | Moves inside `/demos/[themeId]/` |
| `app/collections/page.tsx` | Theme collections | Moves inside `/demos/[themeId]/` |
| `app/about/page.tsx` | Theme about | Moves inside `/demos/[themeId]/` |
| `app/themes/page.tsx` | Theme showcase | Becomes `/demos/page.tsx` |
| `app/themes/[id]/page.tsx` | Per-theme preview | Moves to `/demos/[themeId]/` |
| `app/dashboard/page.tsx` | Basic stats | Full member workspace (3-col) |
| `app/admin/` | Super-admin | Unchanged |
| `prisma/schema.prisma` | Global SiteContent | Add `Site` model, scope content by siteId |
| `lib/getActiveTheme.ts` | Reads global DB row | Context-aware: platform / demo / member site |
| `components/layout/Navbar.tsx` | Store nav | Context-aware: platform / demo / member |
| `hooks/useAriaLive.ts` | Single Aria persona | Three personas via `ariaContext` |
| `store/aria.ts` | activeThemeId | Add `ariaContext: "platform"|"demo"|"member"` |
| `themes/*.ts` | 8 demo configs | Unchanged — also used as new-site templates |

---

## Task 1: Create platform-pivot worktree

**Step 1:** Create worktree
```bash
cd /root/tal-boilerplate
git worktree add .worktrees/platform-pivot -b platform-pivot
cd .worktrees/platform-pivot
ln -sf /root/tal-boilerplate/.env .env
ln -sf /root/tal-boilerplate/.env.local .env.local
```

**Step 2:** Verify baseline
```bash
npx tsc --noEmit
```
Expected: 0 errors

**Step 3:** Commit
```bash
git commit --allow-empty -m "chore: platform-pivot branch baseline"
```

---

## Task 2: Platform homepage

**Goal:** `app/page.tsx` becomes a dark premium marketing page. The current jewelry hero is gone from `/` — it lives at `/demos/jewelry` after Task 4.

**Files to create:**
- `components/platform/PlatformHero.tsx` — dark hero, Aria orb, headline, two CTAs
- `components/platform/DemoShowcase.tsx` — 8-theme grid, each links to `/demos/[id]`
- `components/platform/PricingSection.tsx` — 3 tiers (Starter $29 / Builder $79 / Agency $199)

**Files to modify:**
- `app/page.tsx` — replace jewelry content with `<PlatformHero /> <DemoShowcase /> <PricingSection />`

**PlatformHero design spec:**
- Background: `bg-zinc-950`
- Center: pulsing Aria orb (gradient, inner dark circle)
- Above headline: `text-zinc-400 text-xs tracking-widest uppercase` — "Powered by Aria"
- Headline: `font-serif text-5xl md:text-7xl text-white` — "Your website, built by voice."
- Sub: `text-zinc-400 text-lg max-w-xl` — "Tell Aria what you want. She builds it."
- Two CTAs: `[See live demos →]` (accent bg) + `[Start building]` (border)
- Ambient glow: large blurred circle in accent color behind orb

**DemoShowcase design spec:**
- `bg-zinc-950`, section below hero
- "Live demos" heading + subtitle
- 2×4 grid of theme cards (h-48 each)
- Each card: theme hero image (opacity-50), industry label, brand name, accent color bar at bottom
- Hover: image brightens + scales

**PricingSection design spec:**
- `bg-zinc-900`
- 3 columns, middle card highlighted in white (Builder tier)
- Each: tier name, price, description, feature list with ✓, "Get started →" CTA

**Verify:**
```bash
npx tsc --noEmit
```

**Commit:**
```bash
git add app/page.tsx components/platform/
git commit -m "feat: platform homepage — dark hero, demo grid, pricing"
```

---

## Task 3: Context-aware Navbar

**Goal:** One Navbar component, three visual modes.

**File:** `components/layout/Navbar.tsx` — read it first, then add context detection.

**Logic to add:**
```
const isPlatform  = path === "/" || (path.startsWith("/demos") && !isInsideDemo)
const isDemo      = path.match(/^\/demos\/[^\/]+/)  // /demos/jewelry/* 
const isMember    = path.startsWith("/dashboard")
```

**Platform nav links:** Demos · Pricing · [Sign in] · [Start free →]

**Demo nav links:** [Brand name from theme] · Shop · Collections · About · [← All demos]

**Member nav links:** Dashboard · My Site · Editor · [avatar + sign out]

**Admin nav:** unchanged (already has AdminNav component)

**Note:** Use `usePathname()` (already client) to detect context. Extract theme ID from path for demo nav.

**Verify + Commit:**
```bash
npx tsc --noEmit
git add components/layout/Navbar.tsx
git commit -m "feat: context-aware navbar — platform / demo / member"
```

---

## Task 4: Demo routes under `/demos/[themeId]/`

**Goal:** Each theme becomes a browsable live demo. All 8 are accessible. Demo data comes from `THEMES[themeId]` — no DB reads, no state pollution between demos.

**Files to create:**
- `app/demos/page.tsx` — list all 8 demos (move/copy from `app/themes/page.tsx`)
- `app/demos/[themeId]/layout.tsx` — sets theme CSS vars + "Demo banner" strip
- `app/demos/[themeId]/page.tsx` — theme hero + featured products (from THEMES config)
- `app/demos/[themeId]/products/page.tsx` — products from `THEMES[themeId].products`
- `app/demos/[themeId]/collections/page.tsx` — from `THEMES[themeId].collections`
- `app/demos/[themeId]/about/page.tsx` — from `THEMES[themeId].about`
- `components/layout/ThemeApplierStatic.tsx` — accepts `theme: ThemeConfig` prop, injects CSS vars (same logic as ThemeApplier but prop-driven, not DB-driven). Note: uses same safe dangerouslySetInnerHTML pattern as existing ThemeApplier — values are build-time constants from THEMES, not user input.

**Demo layout spec:**
- Fixed top strip (z-50): dark bar showing "Demo: [Brand name] — Aria is in character" + "← All demos" link
- Shift main content down `pt-7` to clear the strip
- Inject `ThemeApplierStatic` with `THEMES[themeId]` — overrides global CSS vars for demo pages

**Demo products page spec:**
- Same grid layout as `app/products/page.tsx`
- But reads from `THEMES[themeId].products` array (no Prisma call)
- Products are display-only in demo context — "Add to demo cart" CTA (cart works, but makes clear it's a demo)

**Old routes to keep:** `app/products`, `app/collections`, `app/about` stay for the member's active site (reads from DB + getActiveTheme). The demo routes are separate.

**Verify:**
```bash
npx tsc --noEmit
```

**Commit:**
```bash
git add app/demos/ components/layout/ThemeApplierStatic.tsx
git commit -m "feat: /demos/[themeId] — isolated live demos, no DB reads"
```

---

## Task 5: Prisma schema — `Site` model (multi-tenant)

**File:** `prisma/schema.prisma`

**Step 1: Add Site model**
```prisma
model Site {
  id        String   @id @default(cuid())
  name      String   @default("My Site")
  themeId   String   @default("jewelry")
  ownerId   String
  owner     User     @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  plan      String   @default("starter")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  content   SiteContent[]
  snapshots SiteSnapshot[]
  products  Product[]
}
```

**Step 2: Add `siteId` to SiteContent and SiteSnapshot**
```prisma
model SiteContent {
  id           String   @id
  siteId       String   @default("global")
  site         Site?    @relation(fields: [siteId], references: [id], onDelete: Cascade)
  ...existing fields...
}

model SiteSnapshot {
  id          String   @id @default(cuid())
  siteId      String   @default("global")
  site        Site?    @relation(fields: [siteId], references: [id], onDelete: Cascade)
  ...existing fields...
}
```

**Step 3: Add `siteId` to Product (optional, for multi-site product catalogs)**
```prisma
model Product {
  ...existing fields...
  siteId  String?
  site    Site?   @relation(fields: [siteId], references: [id], onDelete: SetNull)
}
```

**Step 4: Add `sites` to User**
```prisma
model User {
  ...existing fields...
  sites Site[]
}
```

**Step 5: Run migration**
```bash
npx prisma migrate dev --name add-site-model
npx prisma generate
```

**Step 6: Verify TypeScript**
```bash
npx tsc --noEmit
```

**Step 7: Commit**
```bash
git add prisma/
git commit -m "feat(schema): Site model — multi-tenant foundation"
```

---

## Task 6: Auto-provision Site on first login

**File:** `lib/auth.ts` — session callback

**Change:** After setting `session.user.subscriptionTier`, check if user has any sites. If not, create one:
```ts
const dbUser = await prisma.user.findUnique({
  where: { id: user.id },
  select: { subscriptionTier: true, sites: { select: { id: true }, take: 1 } },
})
if (dbUser?.sites.length === 0) {
  await prisma.site.create({
    data: { name: "My Site", themeId: "jewelry", ownerId: user.id, plan: dbUser.subscriptionTier ?? "starter" },
  })
}
```

**Verify + Commit:**
```bash
npx tsc --noEmit
git add lib/auth.ts
git commit -m "feat(auth): auto-provision Site on first login"
```

---

## Task 7: Member workspace — redesign `/dashboard`

**Goal:** The dashboard becomes the creative hub. Not a stats page — a *site workspace* where everything is one click (or one voice command) away.

**Files:**
- `app/dashboard/layout.tsx` — auth guard (already partially exists, read first)
- `app/dashboard/page.tsx` — full redesign

**Layout spec (desktop: 3 columns, mobile: stacked):**

```
┌─────────────────────────────────────────────────────┐
│  [Site name] ▾          [View live] [Open editor]  │  ← top bar
├──────────────┬───────────────────────┬──────────────┤
│              │                       │              │
│  Site nav    │   Site overview       │  Aria invite │
│              │   (theme, stats,      │              │
│  • Home      │    last edit, URL)    │  ◎ pulsing   │
│  • Products  │                       │              │
│  • Collections│  Quick actions:      │  "Ask me to  │
│  • About     │  Edit hero · Add      │   edit your  │
│  • Settings  │  product · Switch     │   site"      │
│              │  theme                │              │
│              │                       │  [Connect]   │
└──────────────┴───────────────────────┴──────────────┘
```

**Aria invite (right column):**
- Pulsing orb
- Copy: "Ready to help" in small text
- 3 example prompts: "Change my hero headline", "Switch to the bakery theme", "Add a product"
- Connect button (triggers `ariaConnect()`)

**Quick actions grid:**
- "Edit by voice" → opens Aria
- "Open editor" → `/dashboard/editor`
- "View live site" → `/` (their active site)
- "Switch theme" → `/admin/themes` style picker inline
- "Add product" → `/dashboard/products/new`

**Verify + Commit:**
```bash
npx tsc --noEmit
git add app/dashboard/
git commit -m "feat: member workspace — 3-col dashboard with Aria invite"
```

---

## Task 8: Scope content API to member siteId

**Goal:** `/api/content` reads and writes scoped to the calling member's site, not globally.

**Files:**
- `app/api/content/route.ts`
- `app/api/content/publish/route.ts`
- `app/api/content/snapshot/route.ts`

**Pattern for each route:**
```ts
const session = await auth()
const site = session?.user?.id
  ? await prisma.site.findFirst({ where: { ownerId: session.user.id } })
  : null
const siteId = site?.id ?? "global"
// Pass siteId to all prisma.siteContent queries: { where: { id: key, siteId } }
```

**Migration concern:** Existing SiteContent rows have no siteId (default "global"). They'll continue to work for the admin editor. New member sites get their own rows.

**Verify + Commit:**
```bash
npx tsc --noEmit
git add app/api/content/
git commit -m "feat(api): scope content reads/writes to member siteId"
```

---

## Task 9: Aria — three-context persona system

**Goal:** Aria knows where she is. On the platform homepage she's a guide. Inside a demo she's a character. In the member editor she's a builder.

**Files:**
- `store/aria.ts` — add `ariaContext: "platform" | "demo" | "member"`
- `hooks/useAriaLive.ts` — extend `buildAriaConfig` with context param

**Step 1: Add to store**
```ts
ariaContext: "platform" as "platform" | "demo" | "member",
setAriaContext: (ariaContext: "platform" | "demo" | "member") => set({ ariaContext }),
```

**Step 2: Platform system prompt (inside buildAriaConfig)**
```
You are Aria, the AI assistant powering a web-building platform.
You help visitors discover what's possible — show them demos, explain how voice editing works,
and guide them toward signing up. Never be salesy. Be genuinely helpful and curious.
Available demos: jewelry, candy, bakery, flowers, wine, restaurant, portfolio, saas.
Keep all responses under 3 sentences. Navigate silently.
```

**Step 3: Platform functions**
- `navigate_to_demo(themeId)` — navigates to `/demos/[themeId]`
- `navigate(url)` — standard navigation
- `scroll_page(direction)` — standard scroll
- `explain_pricing` — describe the 3 tiers verbally

**Step 4: Set context from pages**
- Platform homepage: `useEffect(() => setAriaContext("platform"), [])`  
- Demo layout: `useEffect(() => setAriaContext("demo"), [])`  
- Dashboard: `useEffect(() => setAriaContext("member"), [])`

**Step 5: Verify + commit**
```bash
npx tsc --noEmit
git add store/aria.ts hooks/useAriaLive.ts
git commit -m "feat(aria): three-context persona — platform guide / demo store / member builder"
```

---

## Task 10: Platform nav + footer polish

**Files:**
- `components/layout/Navbar.tsx` — already updated in Task 3, verify platform links correct
- `components/layout/Footer.tsx` — update to company/platform footer
- `components/ui/ShippingBanner.tsx` — only render inside `/demos/*` routes (not on platform homepage)

**Footer content:**
```
[Company logo + tagline]
Demos · Pricing · Docs
© 2026 [Company name] · Terms · Privacy
```

**ShippingBanner:** Read the file, add `const path = usePathname()` check — render only if `path.startsWith("/demos") || path.startsWith("/dashboard")`.

**Verify + Commit:**
```bash
npx tsc --noEmit
git add components/layout/Footer.tsx components/ui/ShippingBanner.tsx
git commit -m "feat: platform footer + context-aware shipping banner"
```

---

## Task 11: Update MASTER-ROADMAP.md

**File:** `docs/MASTER-ROADMAP.md`

- Add "Platform Pivot" as completed between Plan #3 and #4
- Update Plan #4 note: "Atomic components now serve the member zone (dashboard, editor, settings)"
- Update Plan #6 note: "Visual editor lives at /dashboard/editor"
- Update Plan #8 note: "/demos is the theme marketplace — foundational work done in Platform Pivot"
- Update Plans status table

**Commit:**
```bash
git add docs/MASTER-ROADMAP.md
git commit -m "docs: roadmap updated — platform pivot added, downstream plans updated"
```

---

## Execution order

```
Task 1 → Task 2 → Task 3 → Task 4   (visual, no schema)
              ↓
         Task 5 → Task 6 → Task 8   (schema + API)
              ↓
         Task 7                      (member UX, needs schema)
              ↓
         Task 9 → Task 10 → Task 11  (Aria + polish)
```

Tasks 2-4 can be done first — zero risk, highest demo impact. Show someone the platform homepage before touching any backend.

---

## Model hints

| Tasks | Model | Why |
|-------|-------|-----|
| 1 | haiku | Git ops |
| 2 | sonnet | Platform identity, design decisions |
| 3 | sonnet | Multi-condition context logic |
| 4 | haiku | Route moves with clear pattern |
| 5 | sonnet | Schema design, multi-tenant relations |
| 6 | haiku | Simple callback addition |
| 7 | sonnet | Complex 3-col UX, wow-factor page |
| 8 | sonnet | Multi-tenant API scoping |
| 9 | sonnet | Aria persona engineering |
| 10 | haiku | Nav/footer tweaks |
| 11 | haiku | Docs update |
