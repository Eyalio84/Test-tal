# P6 — Visual Editor v1: Inline Overlay
_Planned: 2026-03-11 | Status: PENDING_

## Vision

The live site runs normally. A floating "Edit Mode" toggle (top-right of screen, owner-only)
activates an overlay. In edit mode, clicking any section opens a floating config panel
*instead* of navigating. All edits route through the existing `PATCH /api/content → publish`
pipeline from P2. Aria stays available throughout, with voice editing locked to Pro tier.

This completes the **Basic tier GUI Builder** — the first paid tier in the product.

---

## What Exists (reuse, don't rebuild)

| Existing asset | Where | What P6 uses it for |
|---|---|---|
| `store/aria.ts` | `editorMode: boolean`, `setEditorMode()` | Keep — EditModeToggle sets this |
| `store/canvas.ts` | `ComponentInstance`, `addComponent()` | Palette drawer adds to canvas |
| `PATCH /api/content` | `app/api/content/route.ts` | Every config panel saves here |
| `POST /api/content/publish` | `app/api/content/publish/route.ts` | EditorToolbar publishes |
| `/api/components` | TanStack Query | Palette drawer loads component registry |
| `EditorToolbar.tsx` | `app/admin/editor/` | Reused as publish bar in edit mode |
| `handleSaveKey(key, value)` | `EditorClient.tsx:172` | The exact save + snapshot pattern to replicate |
| `subscriptionTier` | `session.user.subscriptionTier` | Tier guard on Aria voice in edit mode |

**Critical: do NOT rebuild the save/publish pipeline. PATCH /api/content already handles
draft writes + snapshot creation. Every panel just calls this endpoint.**

---

## Architecture

```
EditModeStore (Zustand)
  ├── editMode: boolean
  ├── selectedSection: string | null   ("hero" | "cta" | "collections" | ...)
  └── panelAnchor: { top, left, width, height } | null   (from getBoundingClientRect)

EditModeToggle  (floating, top-right, owner-only)
  └── toggles editMode + persists to sessionStorage

EditOverlay  (wraps each section component)
  └── in edit mode: onClick → setSelectedSection + setPanelAnchor
  └── renders highlight ring + "click to edit" label

FloatingConfigPanel  (createPortal → document.body)
  └── positions relative to panelAnchor
  └── reads selectedSection → picks panel module via SECTION_MAP
  └── modules: TextPanel | ImagePanel | ColorPanel | SectionOrderPanel

SECTION_MAP  (lib/sectionMap.ts)
  └── "hero"        → { keys: ["hero_headline","hero_subline"], module: "text" }
  └── "cta"         → { keys: ["cta_headline","cta_body"],     module: "text" }
  └── "hero_image"  → { key: "hero_image",                     module: "image" }
  └── "accent"      → { key: "theme_accent",                   module: "color" }
  └── "sections"    → { key: "sections_order",                 module: "order" }

ComponentPaletteDrawer  (left-side, collapsible)
  └── fetches /api/components via TanStack Query
  └── click → addComponent() in canvas store

app/layout.tsx (global shell — mounts on every page)
  └── + EditModeToggle
  └── + FloatingConfigPanel
  └── + ComponentPaletteDrawer
```

---

## File Map

### New files
```
store/editMode.ts                              model-hint: haiku
components/editor/EditModeToggle.tsx           model-hint: haiku
components/editor/EditOverlay.tsx              model-hint: haiku
components/editor/FloatingConfigPanel.tsx      model-hint: sonnet  ← portal + position tracking
components/editor/panels/TextPanel.tsx         model-hint: haiku
components/editor/panels/ImagePanel.tsx        model-hint: sonnet  ← R2 pipeline UX
components/editor/panels/ColorPanel.tsx        model-hint: haiku
components/editor/panels/SectionOrderPanel.tsx model-hint: haiku
components/editor/ComponentPaletteDrawer.tsx   model-hint: haiku
lib/sectionMap.ts                              model-hint: haiku
```

### Modified files
```
app/layout.tsx                    add EditModeToggle + FloatingConfigPanel + ComponentPaletteDrawer
components/layout/Providers.tsx   pass isOwner prop to EditModeToggle
app/page.tsx (store homepage)     wrap sections with EditOverlay + data-edit-section attrs
hooks/useAriaLive.ts              add toggle_edit_mode function (Pro tier guard)
```

---

## Batch Plan

### Batch 1 — Foundation (model-hint: haiku)
Tasks:
1. `store/editMode.ts` — new Zustand store: `editMode`, `selectedSection`, `panelAnchor`, `toggleEditMode()`, `selectSection(id, rect)`, `clearSelection()`
2. `lib/sectionMap.ts` — map of section IDs → `{ label, keys: string[], module: "text"|"image"|"color"|"order" }`
3. `components/editor/EditModeToggle.tsx` — floating button (fixed top-right, z-50), reads `session` via `useSession()` to only render for owner, onClick toggles `editMode`, persists to sessionStorage on mount via `useEffect`
4. Wire `EditModeToggle` into `app/layout.tsx` (add import + mount after `<AccessibilityPanel />`)
5. `npx tsc --noEmit` must pass

### Batch 2 — EditOverlay + section wrappers (model-hint: haiku)
Tasks:
1. `components/editor/EditOverlay.tsx` — `"use client"` wrapper: in edit mode, shows highlight ring (`ring-2 ring-amber-400`) + "✏ Edit" label on hover; onClick calls `selectSection(sectionId, getBoundingClientRect())`; in non-edit mode renders `{children}` unchanged
2. Add `data-edit-section` to store homepage sections:
   - `components/store/HeroSection.tsx` (or wherever hero renders) → `<EditOverlay sectionId="hero">`
   - `components/store/CtaSection.tsx` → `<EditOverlay sectionId="cta">`
   - `components/store/CollectionsSection.tsx` → `<EditOverlay sectionId="collections">`
3. Verify highlight ring appears in edit mode (visual check)
4. `npx tsc --noEmit` must pass

**⚠ CHECKPOINT after Batch 2:** Toggle works, clicking sections highlights them. No panel yet.

### Batch 3 — FloatingConfigPanel + TextPanel (model-hint: sonnet)
Tasks:
1. `components/editor/FloatingConfigPanel.tsx` — `createPortal(panel, document.body)`, positions via `panelAnchor` (top/left + 20px offset, clamp to viewport), reads `selectedSection`, picks module from SECTION_MAP, close on Escape + outside click
2. `components/editor/panels/TextPanel.tsx` — shows fields for each key in the section's `keys[]`, reads current value from `draftContent` (Zustand aria store), saves via `PATCH /api/content`, shows save confirmation
3. Wire `FloatingConfigPanel` into `app/layout.tsx`
4. `npx tsc --noEmit` must pass

### Batch 4 — Remaining panels (model-hint: haiku)
Tasks:
1. `components/editor/panels/ColorPanel.tsx` — hex color input + native `<input type="color">`, saves to `theme_accent` key, updates CSS var optimistically via `document.documentElement.style.setProperty`
2. `components/editor/panels/SectionOrderPanel.tsx` — lists `sections_order`, up/down buttons, saves via PATCH, reuses the same logic from `EditorClient.tsx:262-295`
3. `components/editor/panels/ImagePanel.tsx` — search box → `GET /api/admin/image-scout/catalog?q=` → show thumbnails → click to set image key via PATCH
4. `npx tsc --noEmit` must pass

### Batch 5 — Palette drawer + Aria (model-hint: haiku)
Tasks:
1. `components/editor/ComponentPaletteDrawer.tsx` — fixed left-side, collapses to thin tab in non-edit mode, expands in edit mode; fetches `/api/components` via TanStack Query; groups by category; click → `addComponent(slug, {})` in canvas store
2. Add `toggle_edit_mode` Aria function to `hooks/useAriaLive.ts`:
   - Function definition: `{ name: "toggle_edit_mode", description: "Toggle the visual editor edit mode on or off", parameters: {} }`
   - Available in `member` context only
   - Tier guard: if `aria().subscriptionTier` is `"free"` or `"basic"`, return `"Edit mode voice control requires Pro tier. You can still use the mouse toggle."`
   - Otherwise: call `useEditMode.getState().toggleEditMode()`
3. Add silence rule: `- toggle_edit_mode: execute silently. Say nothing unless tier-blocked.`
4. `npx tsc --noEmit` must pass

### Batch 6 — Tests + smoke (model-hint: haiku)
Tasks:
1. `tests/store/editMode.test.ts` — unit tests: toggleEditMode, selectSection, clearSelection, sessionStorage hydration
2. `tests/lib/sectionMap.test.ts` — validates all SECTION_MAP entries have required fields
3. Smoke test checklist (manual):
   - [ ] Edit toggle only visible when logged in as owner
   - [ ] Clicking toggle activates ring highlights on sections
   - [ ] Clicking hero → TextPanel opens with headline + subline fields
   - [ ] Saving a field → PATCH /api/content → snapshotId returned
   - [ ] Publish button → POST /api/content/publish → toast confirmation
   - [ ] Pressing Escape → closes panel
   - [ ] Edit mode off → site looks completely normal (no rings, no panel)
   - [ ] Palette drawer opens/closes
4. `npx tsc --noEmit && npm test` must both pass

---

## Execution Order + Dependencies

```
Batch 1 (Haiku)
    ↓
Batch 2 (Haiku)       Batch 5-palette (Haiku, just store setup)
    ↓                      [can start after Batch 1]
Batch 3 (Sonnet)
    ↓
Batch 4 (Haiku)
    ↓
Batch 5 (Haiku) — full
    ↓
Batch 6 (Haiku)
```

Recommended session: Batches 1+2+4+6 in a single Haiku parallel session.
Batches 3 (FloatingConfigPanel) handled by Sonnet before Batch 4.

---

## Tier Gating

| Feature | Basic | Pro | Max |
|---|---|---|---|
| Edit Mode toggle (mouse) | ✅ | ✅ | ✅ |
| TextPanel, ColorPanel, OrderPanel | ✅ | ✅ | ✅ |
| ImagePanel (R2 pipeline) | ✅ | ✅ | ✅ |
| Component Palette | ✅ | ✅ | ✅ |
| Aria voice commands in edit mode | ❌ CTA | ✅ | ✅ |

---

## Key Constraints

1. **Do not rebuild PATCH /api/content.** All panels save via this endpoint. The snapshot, undo stack, and rate limiting are already there.
2. **EditOverlay must be zero-cost when editMode is false.** No extra DOM, no extra event listeners. Just `{children}`.
3. **FloatingConfigPanel must use `createPortal`.** Positioning it inside the section div will cause clipping issues with `overflow: hidden` parents.
4. **sessionStorage key:** `"storekit_edit_mode"` — hydrate on mount in EditModeToggle.
5. **Owner check:** compare `session.user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL` OR pass `isOwner` prop from server layout. Prefer server-side: read `ADMIN_EMAIL` in `app/layout.tsx`, pass `isOwner={theme.id && session?.user?.email === process.env.ADMIN_EMAIL}` to `<Providers>`.

---

## What P6 Does NOT Include (P7)

- Drag-and-drop to reorder sections
- Aria canvas awareness ("add a section after hero" by voice → P7)
- Multi-user editing (P-RC)
- Rich text / markdown editor
- Custom CSS panel
