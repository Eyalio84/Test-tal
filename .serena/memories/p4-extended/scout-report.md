# P4 Extended: Atomic Component Library + Registry System — Scout Report

**Feature:** Build 30-50 atomic components with database-backed registry + Aria integration

**Report Date:** 2026-03-09

## 1. Affected Areas

### Models / Schema
- **NEW:** `Component` table in Prisma
  - Fields: `id`, `slug` (unique), `name`, `category`, `description`, `propsSchema` (JSON), `previewImage` (R2 URL), `ariaName`, `ariaDescription`, `createdAt`, `updatedAt`
  - Relations: optional multi-tenant via `siteId` FK (like `Product`, `SiteContent`, `SiteSnapshot`)
  
- **EXISTING to extend:** `SiteContent` — may store component-palette preferences per site
- **EXISTING to extend:** `ThemeImage` — can store component preview images (but dedicated `Component.previewImage` likely cleaner)

### API Routes (NEW)
- `/api/components` — GET all, POST create (admin-only), PATCH bulk update
- `/api/components/[slug]` — GET detail, PATCH update (admin), DELETE (admin)
- `/api/components/search` — GET with filters (category, tags, variants)
- `/api/components/preview/[slug]` — GET rendered component JSON for Aria consumption

### UI Components (NEW)
- `/app/admin/components` — registry admin view (CRUD grid + upload previews)
- `/app/components` — public showcase (filterable, searchable grid)
- `/app/dashboard/editor/ComponentPalette.tsx` — in-editor palette panel
- 30-50 atomic components themselves (buttons, cards, inputs, overlays, etc.)

### Store / State
- `store/components.ts` — Zustand store for:
  - Selected components (editor state)
  - Component palette filters
  - Draggable component staging
- `store/aria.ts` — extend with component-palette Aria context

### Auth / Guards
- Admin-only: `/admin/components` and `POST /api/components/*`
- Public: `/components` showcase
- Authenticated: `/dashboard/editor` palette (scoped to user's site)

### External Services
- **R2 integration:** preview images compressed & stored like theme images
- **Gemini Live API:** Aria context updated to include component catalog with names/slugs

## 2. Related Files Found

### Existing Admin CRUD patterns
- `/app/admin/media/page.tsx` — R2 file upload UI (grid, drag-drop, mutation)
- `/app/api/media/upload/route.ts` — POST with file validation, compression, DB upsert
- `/app/api/media/images/route.ts` — GET query by themeId, returns slot→url map
- `/app/admin/page.tsx` — admin dashboard with stats and shortcuts

### Existing API CRUD patterns
- `/app/api/product/[slug]/route.ts` — simple GET by slug
- `/app/api/theme/route.ts` — GET available themes, POST to switch theme + seed products
- `/app/api/content/route.ts` — GET (multi-tenant aware), PATCH with snapshot + rate-limiting, PATCH with confirmation for destructive ops

### Existing Validation & Image handling
- `/lib/validations.ts` — Zod schemas (uploadSchema pattern)
- `/lib/r2.ts` — r2Key(), r2Url() helpers, S3Client config
- `/lib/compress.ts` — compressImage(buffer) → WebP via Sharp
- `/env.ts` — centralized env vars with Zod validation

### Existing Component Library (base)
- `/lib/componentRegistry.ts` — already exists! COMPONENT_REGISTRY with 13 entries (Button, Badge, Input, Select, Card, Dialog, Tabs, DataTable, Skeleton, Spinner, EmptyState, Breadcrumb)
- `/components/ui/*.tsx` — atomic UI components (30+ already built)
- `/tests/lib/componentRegistry.test.ts` — validates registry structure
- `/tests/ui/*.test.tsx` — component tests (Button, Badge, Input, Skeleton, EmptyState, Card, Dialog, Tabs, DataTable, Breadcrumb)

### Aria Integration patterns
- `/hooks/useAriaLive.ts` — buildAriaConfig() creates theme-aware + context-aware function definitions
- `store/aria.ts` — AriaStore with `ariaContext` ("platform" | "demo" | "member")
- `/app/api/aria/memory/route.ts` — user memory persistence (could extend for component preferences)
- `/app/admin/editor/EditorClient.tsx` — editor mode detection, command execution

### Multi-tenant patterns
- `/prisma/schema.prisma` — `Product`, `SiteContent`, `SiteSnapshot` all have nullable `siteId` FK
- `/app/api/content/route.ts` — resolves `siteId` from session, fetches site-specific + global rows, site-specific overrides global
- `/app/admin/layout.tsx` — admin auth guard (email check)
- `/lib/auth.ts` — auto-provisions Site on first login

### Testing patterns
- `/tests/lib/componentRegistry.test.ts` — validates registry entries, checks minimum count
- `/tests/ui/Button.test.tsx`, etc. — vitest + React Testing Library
- vitest in package.json with jsdom

## 3. Architecture Patterns

### Models
- **Prisma**: @default(cuid()) for IDs, @@unique for slug+scope combos, nullable FKs for multi-tenant, @updatedAt for timestamps
- **Example:** ThemeImage has `@@unique([themeId, slot])` — can apply `@@unique([siteId, slug])` for Component if site-scoped

### API Routes
- **Auth guard:** `const session = await auth()` at top, then check `session?.user?.email === env.ADMIN_EMAIL`
- **Input validation:** Zod schema, `safeParse`, flatten errors in 400 response
- **Rate limiting:** optional `rateLimit(ip, limit, window)` from `/lib/rateLimit.ts`
- **Response pattern:** `NextResponse.json({ ok: true, ... })` or `{ error: "...", status: 4xx }`
- **Multi-tenant:** query by siteId, fetch site-specific + global, site-specific overrides

### UI Components
- **Pattern:** `"use client"` at top, Zustand stores, TanStack Query for server state
- **Admin forms:** mutation + onSuccess invalidate queryKey
- **File upload:** HTMLInputElement ref, FormData, drag-drop handler
- **Image preview:** Next/Image with fill + sizes + object-cover
- **Grid layout:** grid-cols-3 or 4 with gap-4, responsive via md: breakpoint

### Image Storage
- **Compression:** compressImage(buffer) → webp, max 800px wide, quality 80
- **R2 upload:** PutObjectCommand with CacheControl: public, max-age=31536000
- **DB record:** ThemeImage with slug/themeId unique constraint, stores r2Key + url
- **URL retrieval:** r2Url(key) = `${R2_PUBLIC_URL}/${key}`

### Aria Integration
- **Config builder:** buildAriaConfig(themeId) returns { voice, functions, systemPrompt }
- **Context awareness:** ariaContext ("platform" | "demo" | "member") changes persona + available functions
- **Function definitions:** name, description, parameters (type: OBJECT, properties, required)
- **Execution:** switch(name) in executeCommand(), async functions can return data to Aria
- **User memory:** POST /api/aria/memory with key/value, injected into system prompt

### State Management
- **Zustand stores:** `/store/*.ts`, create((set, get) => ({ actions, state }))
- **TanStack Query:** useQuery({ queryKey: [...], queryFn: () => fetch(...) })
- **Mutations:** useMutation({ mutationFn, onSuccess: () => queryClient.invalidateQueries(...) })
- **Optimistic updates:** mutations set local state before API call

### Admin Layout
- Session auth guard + email check in layout.tsx
- AdminNav component with icon + label, routes to /admin/* pages
- Stats cards (4-col grid), data table with sorting/filtering
- Shortcut cards to common actions (theme switch, editor, media)

## 4. Gotchas & Constraints

### Database & Multi-tenancy
- **siteId is nullable, not defaulted** — FK constraint allows NULL (global content) — any Component table must follow same pattern
- **Migration order matters** — Prisma schema changes require `npx prisma migrate dev`, but schema.prisma has no migrations history in this repo (managed entirely by Prisma)
- **Snapshot system** — existing /api/content creates snapshots on PATCH, trims to 10 most recent — consider similar pattern for component edits or skip for now

### TypeScript & Imports
- **TSConfig strict:** no `any` types, all imports must be typed
- **Next.js App Router:** all layouts/pages are async by default, `"use client"` required for hooks
- **Zod imports:** const, not export — defined inline in validations.ts
- **Class-variance-authority:** used for variant definitions in Button (cva helper)

### Image Pipeline
- **compressImage is server-only** — async with Sharp, can't run client-side
- **No middleware.ts** — admin protection happens in layout.tsx, not Edge
- **R2 URLs are public CDN** — no auth required to fetch, but signing doesn't hurt
- **Concurrent uploads:** media/upload route doesn't explicitly handle race conditions (last-write-wins on upsert)

### Aria Integration
- **Function definitions use OBJECT parameters** — Gemini Live API expects snake_case param names in descriptions, but function_declarations structure is specific
- **Silence rules are strict** — navigate/scroll must return undefined, others return status string
- **buildAriaConfig() runs at connect time** — changes to component list require reconnect (user voice reconnect)
- **ariaContext is global state** — switching contexts mid-session requires buildAriaConfig() rebuild

### API Rate Limiting
- Simple in-memory check using `/lib/rateLimit.ts` — not persistent across server restarts
- TODO (pre-launch): add Upstash Redis for real rate limiting

### Validation & Error Handling
- **Zod schemas fail silently** — safeParse returns { success: false, error } — must handle both branches
- **Next.js Error boundary:** default error.tsx catches all errors in that route segment
- **Sentry integration:** enabled in production, disabled in dev (see env.ts optional SENTRY_DSN)

### Component Registry
- **lib/componentRegistry.ts already exists** — defines interface and exports COMPONENT_REGISTRY array
- **Current entries are static TS objects** — not DB-backed yet — migration path: read from DB at runtime, fall back to static if DB fails

## 5. Question Skeleton — Gaps for Planning Interview

### Scope & Prioritization
- **Gap 1:** Should the component library be pre-built (30-50 atomic components coded upfront) or built on-demand as Aria requests them? Pre-built = bigger scope but demo-ready. On-demand = lean MVP but slower voice experience.
- **Gap 2:** Multi-tenant scope: should a user's site have its own component palette/preferences, or is the component library global (all users see same 30-50)? Site-specific = added DB complexity but richer customization.

### Registry Implementation
- **Gap 3:** Should Component registry live entirely in DB (migrate lib/componentRegistry.ts to dynamic fetch), or hybrid (static TS fallback for core 15-20, DB for custom user components)? DB-only = simpler, hybrid = safer failover.
- **Gap 4:** What data should propsSchema store? JSON Schema spec? TypeScript interface shape? Zod schema string? This drives Aria's ability to guide users to valid prop combinations.

### Preview & Visualization
- **Gap 5:** How should component previews work? Option A: static PNG uploaded to R2 (like theme images). Option B: render at build time. Option C: lazy-render on-demand in the showcase page. PNG = fastest, render = always fresh.
- **Gap 6:** Should preview images include variant showcase (all button sizes/colors in one grid) or single canonical preview per component?

### Aria Integration
- **Gap 7:** What voice commands should trigger component insertion? "Add a button" → which variant? "Insert a blue primary button with loading state" → need parameter hints. Should Aria ask clarifying questions or guess?
- **Gap 8:** Should Aria have read-only access to the component catalog (describe available components, answer questions) vs. write access (add/configure/remove components from the editor)? Read-only = safer, write = more powerful.

### Editor UX
- **Gap 9:** In /admin/editor, should the ComponentPalette be a sidebar panel, drawer, or modal? Sidebar = always visible but consumes space. Modal = clean but modal fatigue.
- **Gap 10:** Should users be able to save component "templates" (presets with fixed props) to speed up reuse? Yes = richer UX, no = simpler MVP.

### Admin UX
- **Gap 11:** For /admin/components CRUD, do we need a full visual editor (component sandbox rendering all variants) or just a text form + preview image upload? Sandbox = powerful but complex. Form = simple but less helpful for discovery.
- **Gap 12:** Should admins be able to batch-import components (JSON file with 20 component specs) or strictly one-at-a-time via UI?

### Performance & Data Flow
- **Gap 13:** Aria buildAriaConfig() injects component names/descriptions into system prompt. How many components can the prompt hold before token budgets become tight? Should we paginate (Aria requests "show me buttons", "show me forms") or always include all?
- **Gap 14:** Should /api/components/search support faceted filtering (category, variant, hasPropSchema, etc.) or just keyword search? Facets = richer UX but API complexity.

---

## File Inventory

**Key files to modify/create:**

| Area | File(s) | Action |
|------|---------|--------|
| Schema | `/prisma/schema.prisma` | ADD `Component` model |
| API | `/app/api/components/route.ts` | NEW |
| API | `/app/api/components/[slug]/route.ts` | NEW |
| Admin UI | `/app/admin/components/page.tsx` | NEW |
| Public UI | `/app/components/page.tsx` | NEW |
| Editor UI | `/app/dashboard/editor/ComponentPalette.tsx` | NEW |
| Store | `/store/components.ts` | NEW |
| Aria | `/hooks/useAriaLive.ts` | EXTEND buildAriaConfig() |
| Aria | `/store/aria.ts` | EXTEND with component palette state |
| Validation | `/lib/validations.ts` | ADD componentSchema, prosSchemaProp |
| Library | `/lib/componentRegistry.ts` | REFACTOR from static to DB-backed OR keep static as fallback |
| UI Components | `/components/ui/*.tsx` | BUILD/EXTEND (30-50 target) |
| Tests | `/tests/lib/components.test.ts` | NEW |
| Tests | `/tests/ui/Component*.test.tsx` | NEW (for each component) |

**No changes needed (backward compatible):**
- `/lib/auth.ts`, `/lib/db.ts`, `/lib/r2.ts`, `/lib/compress.ts`, `/env.ts` — re-use existing patterns
- `/components/admin/AdminNav.tsx` — add "/components" route to NAV
- `/app/admin/layout.tsx` — session check already in place
