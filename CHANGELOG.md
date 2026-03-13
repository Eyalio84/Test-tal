# Changelog

All notable changes to StoreKit are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/).

---

## [0.0.2] — 2026-03-13

### Added
- **Platform Shell:** TopBar + BurgerDrawer + BottomTabBar — unified mobile-first navigation replacing 4-mode Navbar
- **Page Composition:** `Page` + `PageSection` Prisma models with soft FK to component registry
- **Page Manager:** `/pages` route — list, reorder, toggle visibility, delete pages
- **Page Editor:** `/pages/[slug]` route — edit sections with 2s debounced auto-save + preview mode
- **Template Cloning:** "Use template" on `/templates` → clones theme pages + sections → redirects to manager
- **Start Blank:** create a single empty Home page from scratch
- **Section Renderer:** `React.lazy()` registry mapping 11 componentSlugs to components
- **Section Inserter:** "+" button between sections in edit mode
- **9 stub section components:** FeaturedProducts, CollectionsGrid, CtaSection, ProductGrid, StorySection, TeamSection, MenuSection, GalleryGrid, FeaturesSection
- **Draggable Aria Orb:** pointer-event drag with 5px threshold, edge snapping, localStorage persistence
- **Aria Page Commands:** `list_pages`, `add_page`, `navigate_to_page` (member context)
- **Shell Store:** Zustand with `persist` — activeTab survives page reloads
- **Canvas↔DB Bridge:** `hydrateFromSections()` + `persistToServer()` on canvas store
- **Rich Onboarding:** empty state with "Start from template" / "Create blank page" CTAs
- **Route-synced Tabs:** BottomTabBar active tab follows current pathname
- **Admin Deprecation Banner:** guides users from `/admin` to the shell's burger menu
- **Page + Section CRUD API:** with Zod validation (`createPageSchema`, `updatePageSchema`, etc.)
- **Template Page Definitions:** `lib/templatePages.ts` — default page structures for all 8 themes
- **Seed API:** `POST /api/pages/seed` — populate pages from active theme template

### Changed
- `app/layout.tsx` — shell components replace Navbar (preserved as `Navbar.legacy.tsx`)
- `components/platform/PlatformHero.tsx` + `PricingSection.tsx` — named → default exports (React.lazy compatibility)
- `store/canvas.ts` — extended with `pageId`, `isDirty`, hydrate/persist methods
- `lib/validations.ts` — added page and section Zod schemas
- `prisma/schema.prisma` — added Page, PageSection models + Site.pages relation
- `hooks/useAriaLive.ts` — 3 new member-only Aria functions
- `docs/MASTER-ROADMAP.md` — EP complete, P5+P6 checked off, Package Point A ready

### Tests
- 183 tests passing (up from 170)
- New: `shell.test.ts`, `canvas-persistence.test.ts`, `sectionRegistry.test.ts`

### Rollback
```bash
git checkout v0.0.1    # restore pre-shell state
```

---

## [0.0.1] — 2026-03-08

### Summary
Foundation release: voice-AI website builder with 8 themes, Aria voice assistant,
inline editor overlay, component library, template demos, and Cloud Run deployment.

### Includes
- **Plans 1–5 complete:** Platform Foundation, Aria-as-Editor, Theme Pack Polish, Platform Pivot, Templates + Aria Assistant
- **Development Infrastructure:** Cloudflare R2 CDN, Biome v2, Vitest, Sentry, TanStack Query, Sharp, Zod, env.ts
- **8 Themes:** jewelry, candy, bakery, flowers, wine, restaurant, portfolio, saas
- **Aria:** 3-context voice assistant (platform/template/member) via Gemini Live WebSocket
- **Report Pad:** session documentation with export
- **Component Library (P4):** registry, CRUD, showcase, palette, SVG previews
- **Cloud Run Deployment:** Dockerfile, standalone output, Neon PostgreSQL
- **170 tests passing**

### Rollback
This is the initial tagged version. No earlier tag exists.
