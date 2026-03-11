# P5 — Templates + Aria Personal Assistant & Debugger
# Last updated: 2026-03-11
# Model: Sonnet (coordinator) | Haiku (batches 1-5) | Sonnet (batches 6-7)

---

## Vision

Elevate the platform from "demo showcases" to "live template stores" — each one a fully navigable,
Aria-powered shopping experience. Simultaneously promote Aria from a shopping assistant to the
owner's personal runtime assistant and debugger, capable of documenting test sessions and reporting
her own changelog.

**The mental model shift:**
- "Demos" = passive showcase → **"Templates"** = active, working proof of product
- Aria in demo = shopping helper → **Aria in template** = full shopping AI, context-aware
- Aria for owner = site editor → **Aria for owner** = assistant + tester + reporter + navigator

---

## Architecture Decisions (locked before implementation)

### 1. Jewelry template IS the owner store
`/templates/jewelry/*` rewrites to the real owner store routes (`/products`, `/cart`, `/checkout`).
No duplicate code — the jewelry template is the live production store.
Implementation: middleware rewrite OR layout that passes `themeId="jewelry"` with DB reads.

### 2. Aria context: rename "demo" → "template"
`ariaContext` values: `"platform" | "template" | "member"` (was `"demo"`).
All references updated. The context signals: "I am in a template store, shopping functions fully active."

### 3. Template cart: Zustand only (no Stripe) for non-jewelry
Non-jewelry templates use Zustand cart (already wired). Cart page shows items + "Create your store" CTA.
Jewelry template routes to real `/cart` → real Stripe checkout.

### 4. Report Pad: floating, persistent, Aria-writable
Lives in root layout. Aria writes via `write_to_report(text, type)`.
Persists in Zustand + localStorage. Export as `.md` file. Copy to clipboard.
Used during test sessions: owner directs Aria to document observations → paste report to coordinator.

### 5. Aria changelog: flat file, injected into system prompt
`lib/ariaChangelog.ts` — array of `{ date, version, capability, description }`.
Injected as a section in `buildAriaConfig()` system prompt.
Aria answers "what's new?" / "what can you do now?" from this data.

---

## Task Breakdown

---

### BATCH 1 — Global rename: demos → templates
**Model hint: Haiku** (mechanical rename, grep-and-replace)

**Files to modify:**
- `app/demos/` → rename entire directory to `app/templates/`
- `components/layout/Navbar.tsx` — update path detection (`/demos` → `/templates`)
- `components/layout/Providers.tsx` — update any ariaContext "demo" setter
- `hooks/useAriaLive.ts` — rename ariaContext "demo" → "template", update all navigate URLs
- `store/aria.ts` — update AriaContext type: `"platform" | "template" | "member"`
- All `app/demos/[themeId]/*` imports and internal links
- `docs/MASTER-ROADMAP.md` — update all "demo" references to "template"
- `app/page.tsx` / `app/demos/page.tsx` (now `app/templates/page.tsx`) — update hrefs

**Key search patterns:**
- `"/demos"` → `"/templates"`
- `ariaContext === "demo"` → `ariaContext === "template"`
- `"demo"` (in AriaContext type) → `"template"`

**Verification:**
```bash
grep -r '"/demos"' app/ components/ hooks/ --include="*.tsx" --include="*.ts"
# must return 0 results
npx tsc --noEmit
```

---

### BATCH 2 — Individual product pages for all templates
**Model hint: Haiku** (well-specified, new file with clear pattern)

**Files to create:**
- `app/templates/[themeId]/products/[slug]/page.tsx`

**Files to modify:**
- `app/templates/[themeId]/products/page.tsx` — wrap product cards in `<Link>` to detail page

**Product detail page spec:**

```typescript
// app/templates/[themeId]/products/[slug]/page.tsx

import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { THEMES } from "@/lib/theme"
import { resolveTheme } from "@/lib/themeImages"
import { TemplateAddToCart } from "@/components/template/TemplateAddToCart"

export async function generateStaticParams() {
  return Object.entries(THEMES).flatMap(([themeId, theme]) =>
    theme.products.map((p) => ({ themeId, slug: p.slug }))
  )
}

// Jewelry: delegate to owner store (DB-backed)
// All others: read from THEMES static config
```

**Layout:**
- 2-col (image left, info right) — mirror `/products/[slug]` layout
- Image: full-height, object-cover
- Info: category tag, name (font-serif), price, description, TemplateAddToCart button
- Breadcrumb: Template Store > Shop > {product.name} (all links)
- Trust signals strip: 3 bullets from `theme.shipping` + generic returns/auth copy
- Related products: 3 random products from same category, same theme

**TemplateAddToCart component:**
```typescript
// components/template/TemplateAddToCart.tsx
// Client component
// Uses useCartStore() to dispatch ADD_TO_CART
// Shows: "Added to cart ✓" on success (brief toast or inline state)
// Links to /templates/[themeId]/cart after add
```

**Verification:**
```bash
# All 8 themes × all products must resolve
# e.g. /templates/bakery/products/croissant-box should render without error
npx tsc --noEmit
```

---

### BATCH 3 — Jewelry template → owner store passthrough
**Model hint: Haiku** (routing logic, no UI)

**Goal:** `/templates/jewelry/*` renders the real owner store, no duplication.

**Implementation:**
Add a check in `app/templates/[themeId]/layout.tsx`:

```typescript
// If themeId === "jewelry" → render children with DB-backed theme (already works via resolveTheme)
// The product pages for jewelry: redirect /templates/jewelry/products/[slug] → /products/[slug]
// OR: the jewelry product detail page reads from DB (prisma.product.findUnique)
```

Cleanest approach: `app/templates/jewelry/products/[slug]/page.tsx` — a specific override that reads from DB (same as `/products/[slug]`) and uses the full `ProductActions` component with real Stripe.

**Files to create:**
- `app/templates/jewelry/products/[slug]/page.tsx` — reads from DB, renders ProductActions (real cart)
- `app/templates/jewelry/cart/page.tsx` — renders `<CartContents />` (same as `/cart`)

This is a Next.js segment override: the `jewelry` slug has specific route files that shadow the `[themeId]` generic ones.

---

### BATCH 4 — Template cart page
**Model hint: Haiku** (new route, reuse existing CartContents component)

**Files to create:**
- `app/templates/[themeId]/cart/page.tsx`

**Spec:**
```typescript
// Shows: ThemeApplierStatic (CSS vars), cart items from Zustand store
// Uses: existing CartContents component OR a TemplateCartContents (lightweight version)
// Footer: "This is a live demo — create your store to checkout" CTA button → /pricing
// Empty state: "Your cart is empty" + link back to /templates/[themeId]/products
```

**Also add "View Cart" link to TemplateAddToCart component after successful add.**

---

### BATCH 5 — Aria changelog system
**Model hint: Haiku** (new file + small injection into existing function)

**Files to create:**
- `lib/ariaChangelog.ts`

**Files to modify:**
- `hooks/useAriaLive.ts` — inject changelog into system prompt + add `get_changelog` function

**Changelog file spec:**
```typescript
// lib/ariaChangelog.ts

export interface ChangelogEntry {
  date: string        // "2026-03-11"
  version: string     // "P4.5"
  capability: string  // short title
  description: string // one sentence
}

export const ARIA_CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026-03-11",
    version: "P5",
    capability: "Template navigation",
    description: "Can navigate to any product in all 8 template stores by name.",
  },
  {
    date: "2026-03-11",
    version: "P5",
    capability: "Session report pad",
    description: "Can write structured test notes to the Report Pad and generate session summaries.",
  },
  {
    date: "2026-03-09",
    version: "P4",
    capability: "Component registry",
    description: "Knows the full component library and can describe any component by name.",
  },
  {
    date: "2026-03-08",
    version: "DI",
    capability: "Private CDN",
    description: "All theme images are now served from Cloudflare R2 — permanent, fast URLs.",
  },
  {
    date: "2026-03-07",
    version: "P3",
    capability: "Theme switching",
    description: "Can switch the active store theme by voice: 'switch to the bakery theme'.",
  },
  {
    date: "2026-03-07",
    version: "P2",
    capability: "Voice site editing",
    description: "Can edit site content, change colors, add/remove sections, and publish by voice.",
  },
]

export function buildChangelogPrompt(): string {
  const recent = ARIA_CHANGELOG.slice(0, 6)
  return `\n## Your Recent Upgrades\n${recent.map(e =>
    `- [${e.date} · ${e.version}] ${e.capability}: ${e.description}`
  ).join("\n")}`
}
```

**Aria function to add in `buildAriaConfig()`:**
```typescript
{ name: "get_changelog",
  description: "List Aria's recent capability upgrades. Use when user asks 'what's new', 'what can you do', 'what were your latest upgrades'.",
  parameters: { type: "OBJECT", properties: {} } }
```

**Handler in executeCommand:**
```typescript
case "get_changelog":
  return ARIA_CHANGELOG.slice(0, 5).map(e => `• ${e.capability} (${e.date}): ${e.description}`).join("\n")
```

**Inject into system prompt:**
In `buildAriaConfig()`, append `buildChangelogPrompt()` to `BASE_SYSTEM_PROMPT`.

---

### BATCH 6 — Session Report Pad
**Model hint: Sonnet** (new UI component, UX decisions, floating panel)

**Files to create:**
- `store/reportPad.ts` — Zustand store
- `components/aria/ReportPad.tsx` — floating panel UI
- `components/aria/ReportPadToggle.tsx` — toggle button (mounts near Aria orb)

**Files to modify:**
- `hooks/useAriaLive.ts` — add `write_to_report`, `clear_report`, `summarize_session` functions
- `app/layout.tsx` — mount `<ReportPad />` and `<ReportPadToggle />`

**Store spec:**
```typescript
// store/reportPad.ts
interface ReportPadStore {
  entries: ReportEntry[]
  isOpen: boolean
  sessionStart: string  // ISO timestamp

  addEntry: (text: string, type: EntryType) => void
  clearAll: () => void
  toggleOpen: () => void
  exportMarkdown: () => string
}

type EntryType = "observation" | "bug" | "navigation" | "test" | "summary" | "aria_note"

interface ReportEntry {
  timestamp: string   // HH:MM:SS
  type: EntryType
  text: string
}
```

**UI spec (ReportPad.tsx):**
- Floating panel: bottom-left, above the fold (opposite side from Aria orb bottom-right)
- Collapsible: header with "Session Report" + timestamp + close button
- Body: scrollable list of entries, color-coded by type
- Footer: two buttons — "Copy Markdown" (clipboard) + "Export .md" (file download)
- Empty state: "No entries yet. Ask Aria to document your test session."
- Width: 380px, max-height: 60vh, overflow-y: auto

**Entry type colors:**
- `bug`: red border-left
- `observation`: blue border-left
- `navigation`: gray (dim)
- `test`: green border-left
- `summary`: purple, bold
- `aria_note`: amber, italic

**Aria functions spec:**
```typescript
// write_to_report
{ name: "write_to_report",
  description: "Write a note to the Session Report Pad. Use when the owner asks you to document something, record a bug, note an observation, or generate a test report. Also use proactively when something notable happens during a test session.",
  parameters: {
    type: "OBJECT",
    properties: {
      text: { type: "STRING", description: "The note to write. Be specific and detailed." },
      type: { type: "STRING", description: "observation | bug | navigation | test | summary | aria_note" }
    },
    required: ["text", "type"]
  }
}

// clear_report
{ name: "clear_report",
  description: "Clear all entries from the Session Report Pad. Use when owner says 'clear the report', 'start fresh', 'reset the pad'.",
  parameters: { type: "OBJECT", properties: {} }
}

// summarize_session
{ name: "summarize_session",
  description: "Generate a structured session summary and write it to the report pad. Use when owner says 'summarize this session', 'generate a report', 'what did we test'.",
  parameters: { type: "OBJECT", properties: {
    focus: { type: "STRING", description: "Optional: what aspect to focus the summary on" }
  }}
}
```

**Handler for summarize_session:**
Aria generates a markdown summary based on:
- Pages visited (from `currentPage` history if tracked, else from report entries)
- Functions called during session (from entry log)
- Bugs/observations already in the pad
- Owner's stated goals for the session

---

### BATCH 7 — Aria full template context + role upgrade
**Model hint: Sonnet** (architectural, touches core Aria config)

**Files to modify:**
- `hooks/useAriaLive.ts` — full template context upgrade
- `components/layout/Providers.tsx` — set ariaContext "template" on /templates/* routes

**Template context upgrade:**

1. `navigate_to_product` — context-aware:
```typescript
case "navigate_to_product":
  if (ariaContext === "template") {
    dispatchCommand({ type: "NAVIGATE", url: `/templates/${aria().activeThemeId}/products/${args.slug}` })
  } else {
    dispatchCommand({ type: "NAVIGATE", url: `/products/${args.slug}` })
  }
  return undefined
```

2. Full shopping functions available in template context (same as demo, now renamed):
- `add_to_cart` ✓ (already works)
- `navigate_to_product` ✓ (updated above)
- `filter_products` ✓ (already works)
- `open_cart` → navigates to `/templates/${themeId}/cart`
- `check_stock` → reads from THEMES static data (not DB) in template context
- `get_recommendations` → reads from THEMES static data

3. **Member context Aria role upgrade:**
Add to member context system prompt:
```
You are Aria, the owner's personal runtime assistant and developer companion.
You can navigate anywhere on the platform, document test sessions in the Report Pad,
answer questions about your own capabilities and changelog, and generate structured
test reports for the coordinator (Claude Code).

When the owner is testing, proactively use write_to_report to document:
- Pages visited and their state
- Features tested and whether they worked
- Bugs or unexpected behavior observed
- Your own function calls and their outcomes
```

4. Add to ALL contexts:
- `write_to_report` function
- `clear_report` function
- `summarize_session` function
- `get_changelog` function

These four functions are **global** — available in platform, template, and member contexts.

---

## File Map Summary

| File | Action | Batch | Model |
|------|--------|-------|-------|
| `app/demos/` (entire dir) | Rename → `app/templates/` | 1 | Haiku |
| `store/aria.ts` | Update AriaContext type | 1 | Haiku |
| `hooks/useAriaLive.ts` | Rename "demo"→"template", context-aware nav | 1+7 | Haiku+Sonnet |
| `components/layout/Navbar.tsx` | Update path detection | 1 | Haiku |
| `app/templates/[themeId]/products/[slug]/page.tsx` | CREATE | 2 | Haiku |
| `app/templates/[themeId]/products/page.tsx` | Add Links to product cards | 2 | Haiku |
| `components/template/TemplateAddToCart.tsx` | CREATE | 2 | Haiku |
| `app/templates/jewelry/products/[slug]/page.tsx` | CREATE (DB override) | 3 | Haiku |
| `app/templates/jewelry/cart/page.tsx` | CREATE | 3 | Haiku |
| `app/templates/[themeId]/cart/page.tsx` | CREATE | 4 | Haiku |
| `lib/ariaChangelog.ts` | CREATE | 5 | Haiku |
| `store/reportPad.ts` | CREATE | 6 | Sonnet |
| `components/aria/ReportPad.tsx` | CREATE | 6 | Sonnet |
| `components/aria/ReportPadToggle.tsx` | CREATE | 6 | Sonnet |
| `app/layout.tsx` | Mount ReportPad | 6 | Sonnet |
| `components/layout/Providers.tsx` | Set "template" context on /templates/* | 7 | Sonnet |

---

## Verification Checklist (full P5)

```bash
npx tsc --noEmit                    # 0 TypeScript errors
npm test                            # all existing tests pass
grep -r '"/demos"' app/ components/ # must return 0 results
grep -r '"demo"' store/aria.ts      # must return 0 results

# Manual smoke test (with Aria):
# 1. /templates/bakery → Aria connects as bakery persona
# 2. Say "show me the croissant box" → navigates to /templates/bakery/products/croissant-box
# 3. Say "add to cart" → cart updates
# 4. Say "open my cart" → /templates/bakery/cart with item
# 5. Say "what are your latest upgrades" → changelog response
# 6. Say "document what I just tested" → Report Pad entry appears
# 7. Say "generate a session summary" → full report written to pad
# 8. Export report → .md file downloaded
# 9. /templates/jewelry → product pages use DB, cart goes to real /cart
```

---

## Roadmap note

This plan replaces the old "P5 — Page Layout Library" in MASTER-ROADMAP.md.
Aria's role is now dual:
- **Customer-facing:** theme-specific shopping assistant (one personality per store)
- **Owner-facing:** personal runtime assistant, developer companion, test session documenter

The Report Pad + changelog make Aria a participant in the development loop —
she can generate the reports that drive the next implementation session.
