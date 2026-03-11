# P6 Haiku Session — Visual Editor v1 (Batches 1, 2, 4, 5, 6)

## Role
You are a senior Next.js engineer implementing the StoreKit visual editor.
Work methodically. Complete each batch fully before moving to the next.
Run `npx tsc --noEmit` after every batch — fix all errors before proceeding.
Do not implement Batch 3 (FloatingConfigPanel) — that is Sonnet's task.

## Working directory
`/root/tal-boilerplate`

## Context — what already exists
Read these files before writing anything:
- `store/aria.ts` — AriaStore has `editorMode: boolean`, `setEditorMode()`, `draftContent`
- `store/canvas.ts` — ComponentInstance, addComponent(), updateComponent()
- `app/api/content/route.ts` — PATCH endpoint (draft write + snapshot), GET endpoint
- `app/api/content/publish/route.ts` — publish endpoint
- `app/layout.tsx` — root layout (you will add imports here)
- `components/layout/Providers.tsx` — client provider wrapper
- `app/admin/editor/EditorClient.tsx` — see handleSaveKey() pattern (lines 172-179) — replicate this in panels
- `docs/plans/2026-03-11-p6-visual-editor-v1.md` — full architecture reference

## Gates (check before each batch)
- GATE 1: Read the relevant existing files listed above BEFORE writing any new file
- GATE 2: `npx tsc --noEmit` must pass after EVERY batch
- GATE 3: Do not use `any` types — use proper TypeScript interfaces
- GATE 4: All new client components must have `"use client"` as the first line
- GATE 5: Do not rebuild PATCH /api/content — call it, don't rewrite it

## Forbidden
- Do NOT touch `app/admin/editor/EditorClient.tsx` — it stays as-is
- Do NOT implement FloatingConfigPanel.tsx (Batch 3) — skip it entirely
- Do NOT use `useState + useEffect + fetch` for server data — use TanStack Query
- Do NOT use `process.env` directly in client components — only server components and `env.ts`
- Do NOT add `"use server"` to anything in this task

## Allowed tools
Read, Write, Edit, Bash (for tsc only), Glob, Grep

---

## BATCH 1 — Foundation

### Task 1.1 — `store/editMode.ts`
Create a new Zustand store (NOT in store/aria.ts — separate file).

```typescript
// store/editMode.ts
"use client"
import { create } from "zustand"

interface PanelAnchor {
  top: number
  left: number
  width: number
  height: number
}

interface EditModeStore {
  editMode: boolean
  selectedSection: string | null
  panelAnchor: PanelAnchor | null
  toggleEditMode: () => void
  selectSection: (id: string, anchor: PanelAnchor) => void
  clearSelection: () => void
}

export const useEditMode = create<EditModeStore>((set) => ({
  editMode: false,
  selectedSection: null,
  panelAnchor: null,
  toggleEditMode: () => set((s) => ({ editMode: !s.editMode, selectedSection: null, panelAnchor: null })),
  selectSection: (id, anchor) => set({ selectedSection: id, panelAnchor: anchor }),
  clearSelection: () => set({ selectedSection: null, panelAnchor: null }),
}))
```

### Task 1.2 — `lib/sectionMap.ts`
Create the section → content key mapping.

```typescript
// lib/sectionMap.ts

export type PanelModule = "text" | "image" | "color" | "order"

export interface SectionConfig {
  label: string
  keys: string[]        // content keys this section edits
  module: PanelModule
}

export const SECTION_MAP: Record<string, SectionConfig> = {
  hero: {
    label: "Hero Section",
    keys: ["hero_headline", "hero_subline"],
    module: "text",
  },
  hero_image: {
    label: "Hero Image",
    keys: ["hero_image"],
    module: "image",
  },
  cta: {
    label: "Call to Action",
    keys: ["cta_headline", "cta_body"],
    module: "text",
  },
  collections: {
    label: "Collections",
    keys: ["collection_1_name", "collection_2_name", "collection_3_name"],
    module: "text",
  },
  accent: {
    label: "Accent Color",
    keys: ["theme_accent"],
    module: "color",
  },
  sections: {
    label: "Page Layout",
    keys: ["sections_order"],
    module: "order",
  },
}
```

### Task 1.3 — `components/editor/EditModeToggle.tsx`
Floating toggle button — fixed top-right, only renders for admin.
- Props: `{ isOwner: boolean }`
- Uses `useEditMode` store
- On mount: reads sessionStorage key `"storekit_edit_mode"` — if `"1"`, call `toggleEditMode()` to hydrate
- On toggle: writes `"1"` or `"0"` to sessionStorage
- Active state: amber/gold background; inactive: translucent dark
- Shows "✏ Edit" when off, "✕ Exit Edit" when on
- Do NOT use `useSession()` — receive `isOwner` prop from server layout

```tsx
// Approximate shape — implement properly
"use client"
import { useEffect } from "react"
import { useEditMode } from "@/store/editMode"

export function EditModeToggle({ isOwner }: { isOwner: boolean }) {
  const { editMode, toggleEditMode } = useEditMode()

  useEffect(() => {
    if (sessionStorage.getItem("storekit_edit_mode") === "1") toggleEditMode()
  }, [])  // eslint-disable-line

  const handleToggle = () => {
    const next = !editMode
    sessionStorage.setItem("storekit_edit_mode", next ? "1" : "0")
    toggleEditMode()
  }

  if (!isOwner) return null
  return (
    <button
      onClick={handleToggle}
      className={`fixed top-4 right-4 z-50 px-3 py-1.5 text-xs tracking-widest uppercase font-medium rounded transition
        ${editMode
          ? "bg-amber-400 text-stone-900 shadow-lg"
          : "bg-stone-900/80 text-white hover:bg-stone-900"
        }`}
    >
      {editMode ? "✕ Exit Edit" : "✏ Edit"}
    </button>
  )
}
```

### Task 1.4 — Wire into `app/layout.tsx`
- Add `import { EditModeToggle } from "@/components/editor/EditModeToggle"`
- Inside `RootLayout`, get `isOwner` from session: `const session = await auth(); const isOwner = session?.user?.email === process.env.ADMIN_EMAIL`
- Mount after `<AccessibilityPanel />`:
  ```tsx
  <EditModeToggle isOwner={isOwner} />
  ```
- Import `auth` from `@/lib/auth` (already used in other server components)

### Batch 1 checkpoint
`npx tsc --noEmit` — fix all errors before proceeding.

---

## BATCH 2 — EditOverlay + Section Wrappers

### Task 2.1 — `components/editor/EditOverlay.tsx`
A client wrapper that activates in edit mode.

Requirements:
- `"use client"`
- Props: `{ sectionId: string; children: React.ReactNode; className?: string }`
- Uses `useEditMode` store
- When `!editMode`: renders `<div className={className}>{children}</div>` — no extra cost
- When `editMode`:
  - Renders a `relative` wrapper with:
    - Amber ring on hover: `hover:ring-2 hover:ring-amber-400 hover:ring-offset-2`
    - Selected state: solid ring `ring-2 ring-amber-500`
    - A label badge top-right: `"✏ " + sectionLabel` from SECTION_MAP[sectionId]?.label
  - `onClick` handler:
    ```typescript
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      const rect = e.currentTarget.getBoundingClientRect()
      selectSection(sectionId, { top: rect.top, left: rect.left, width: rect.width, height: rect.height })
    }
    ```
  - `cursor-pointer` class in edit mode

### Task 2.2 — Find and wrap store sections
Read `app/page.tsx` (the store homepage) to understand current section structure.
Then find the actual section components and wrap them with EditOverlay.

IMPORTANT: Read the files before modifying. Use Glob to find:
- `components/store/HeroSection.tsx` or similar (or look at app/page.tsx to see what's imported)
- Wrap the hero section: `<EditOverlay sectionId="hero">...</EditOverlay>`
- Wrap any CTA section with `sectionId="cta"`
- Wrap collections section with `sectionId="collections"`

If sections are rendered directly in `app/page.tsx`, wrap them there.
If they are in separate component files, add EditOverlay wrapper inside those files.

After wrapping, `editMode=true` should show amber highlight rings on all sections.

### Batch 2 checkpoint
`npx tsc --noEmit` — fix all errors before proceeding.

---

## BATCH 3 — SKIP
Batch 3 (FloatingConfigPanel.tsx, TextPanel.tsx) is Sonnet's responsibility.
Do not implement these files. Skip to Batch 4.

---

## BATCH 4 — Remaining Panel Modules

NOTE: FloatingConfigPanel does not exist yet when you implement these panels.
Write the panels as standalone components that receive `contentKey: string` and `onSave: (key: string, value: string) => Promise<void>` props. They will be wired into FloatingConfigPanel by Sonnet.

### Task 4.1 — `components/editor/panels/ColorPanel.tsx`

Requirements:
- `"use client"`
- Props: `{ contentKey: string; currentValue: string; onSave: (key: string, value: string) => Promise<void> }`
- Shows `<input type="color">` and hex text input (synced)
- On change: optimistic update via `document.documentElement.style.setProperty("--theme-accent", value)`
- Save button → calls `onSave(contentKey, hexValue)`
- Show "Saved ✓" confirmation for 2s after save

### Task 4.2 — `components/editor/panels/SectionOrderPanel.tsx`

Requirements:
- `"use client"`
- Props: `{ currentOrder: string[]; onSave: (key: string, value: string) => Promise<void> }`
- Shows ordered list with up/down buttons — reuse the exact same UI pattern from `app/admin/editor/EditorClient.tsx` lines 262-295
- On move: optimistic local state update → call `onSave("sections_order", JSON.stringify(newOrder))`

### Task 4.3 — `components/editor/panels/ImagePanel.tsx`

Requirements:
- `"use client"`
- Props: `{ contentKey: string; currentValue: string; onSave: (key: string, value: string) => Promise<void> }`
- Search input → `GET /api/admin/image-scout/catalog?q={query}` via `useQuery`
- Results: grid of thumbnail images (use `<Image>` from next/image)
- Click image → calls `onSave(contentKey, r2Url)` immediately
- Show "Selected ✓" on the active image
- Empty state: "Search for an image above"

### Batch 4 checkpoint
`npx tsc --noEmit` — fix all errors before proceeding.

---

## BATCH 5 — Component Palette Drawer + Aria

### Task 5.1 — `components/editor/ComponentPaletteDrawer.tsx`

Requirements:
- `"use client"`
- Fixed left-side drawer, `z-40`
- When `!editMode`: invisible (no width, no DOM cost — use `hidden` or `translate-x-full`)
- When `editMode`: slides in from left, 240px wide, dark surface (`bg-stone-900 text-white`)
- Fetches component registry: `useQuery({ queryKey: ["components"], queryFn: () => fetch("/api/components").then(r => r.json()) })`
- Groups by `component.category`
- Each component shows: name + category chip
- On click: `useCanvas().addComponent(component.slug, {})` + show "Added ✓" toast
- Wire into `app/layout.tsx` (import + mount alongside EditModeToggle)

### Task 5.2 — `toggle_edit_mode` Aria function in `hooks/useAriaLive.ts`

Read `hooks/useAriaLive.ts` first. Then:

1. Add to the `ARIA_FUNCTIONS` array (in the member context section, near other member functions):
```typescript
{
  name: "toggle_edit_mode",
  description: "Toggle the visual editor edit mode on or off for the live site",
  parameters: { type: "object", properties: {}, required: [] },
}
```

2. Add to silence rules (the long comment block listing function names):
```
- toggle_edit_mode: execute silently if toggled on. Say "Edit mode activated." if on, "Edit mode off." if off.
```

3. Add to `executeCommand` switch:
```typescript
case "toggle_edit_mode": {
  const { subscriptionTier } = aria()
  if (subscriptionTier === "free" || subscriptionTier === "basic") {
    return "Edit mode voice control requires a Pro subscription. You can still use the edit button at the top of the screen."
  }
  const { useEditMode } = await import("@/store/editMode")
  const { toggleEditMode, editMode } = useEditMode.getState()
  toggleEditMode()
  return editMode ? "Exited edit mode." : "Edit mode activated."
}
```

Note: check how `subscriptionTier` is accessed in the existing aria store (it may be on the aria store state or via a different mechanism — read the file first).

### Batch 5 checkpoint
`npx tsc --noEmit` — fix all errors before proceeding.

---

## BATCH 6 — Tests

### Task 6.1 — `tests/store/editMode.test.ts`
```typescript
import { describe, it, expect, beforeEach } from "vitest"
import { useEditMode } from "@/store/editMode"

describe("editMode store", () => {
  beforeEach(() => {
    useEditMode.setState({ editMode: false, selectedSection: null, panelAnchor: null })
  })

  it("toggles editMode", () => {
    useEditMode.getState().toggleEditMode()
    expect(useEditMode.getState().editMode).toBe(true)
  })

  it("clears selection on toggle", () => {
    useEditMode.setState({ selectedSection: "hero", panelAnchor: { top: 0, left: 0, width: 100, height: 50 } })
    useEditMode.getState().toggleEditMode()
    expect(useEditMode.getState().selectedSection).toBeNull()
  })

  it("selectSection sets id and anchor", () => {
    const anchor = { top: 100, left: 0, width: 800, height: 200 }
    useEditMode.getState().selectSection("hero", anchor)
    expect(useEditMode.getState().selectedSection).toBe("hero")
    expect(useEditMode.getState().panelAnchor).toEqual(anchor)
  })

  it("clearSelection resets both", () => {
    useEditMode.setState({ selectedSection: "cta", panelAnchor: { top: 0, left: 0, width: 100, height: 50 } })
    useEditMode.getState().clearSelection()
    expect(useEditMode.getState().selectedSection).toBeNull()
    expect(useEditMode.getState().panelAnchor).toBeNull()
  })
})
```

### Task 6.2 — `tests/lib/sectionMap.test.ts`
```typescript
import { describe, it, expect } from "vitest"
import { SECTION_MAP } from "@/lib/sectionMap"

describe("SECTION_MAP", () => {
  it("all entries have required fields", () => {
    for (const [id, config] of Object.entries(SECTION_MAP)) {
      expect(config.label, `${id} missing label`).toBeTruthy()
      expect(config.keys.length, `${id} has no keys`).toBeGreaterThan(0)
      expect(["text","image","color","order"]).toContain(config.module)
    }
  })
})
```

### Task 6.3 — Final check
`npx tsc --noEmit && npm test`
Both must pass. Report results.

---

## Deliverable
On completion, report:
1. Files created (list)
2. Files modified (list + what changed)
3. TypeScript: PASS / FAIL (with errors if any)
4. Tests: X/X passing
5. Any decisions made that deviated from the plan (and why)
